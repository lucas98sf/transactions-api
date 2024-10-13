import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    prismaService = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await prismaService.transaction.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  it('/api/users (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
  });

  it('/api/auth/login (POST)', async () => {
    await request(app.getHttpServer()).post('/api/users').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
  });

  it('/api/transactions (POST)', async () => {
    const user1 = await request(app.getHttpServer()).post('/api/users').send({
      email: 'sender@example.com',
      password: 'password123',
    });

    const user2 = await request(app.getHttpServer()).post('/api/users').send({
      email: 'recipient@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'sender@example.com',
        password: 'password123',
      });

    const token = loginResponse.body.access_token;

    await prismaService.user.update({
      where: { id: user1.body.id },
      data: { balance: 1000 },
    });

    const response = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientId: user2.body.id,
        amount: 100,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.senderId).toBe(user1.body.id);
    expect(response.body.recipientId).toBe(user2.body.id);
    expect(response.body.amount).toBe('100');
  });

  it('/api/transactions/:id/reverse (POST)', async () => {
    const user1 = await request(app.getHttpServer()).post('/api/users').send({
      email: 'sender@example.com',
      password: 'password123',
    });

    const user2 = await request(app.getHttpServer()).post('/api/users').send({
      email: 'recipient@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'sender@example.com',
        password: 'password123',
      });

    const token = loginResponse.body.access_token;

    await prismaService.user.update({
      where: { id: user1.body.id },
      data: { balance: 1000 },
    });

    const transactionResponse = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientId: user2.body.id,
        amount: 100,
      });

    const reverseResponse = await request(app.getHttpServer())
      .post(`/api/transactions/${transactionResponse.body.id}/reverse`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(reverseResponse.body).toHaveProperty('id');
    expect(reverseResponse.body.reversed).toBe(true);

    const updatedUser1 = await prismaService.user.findUnique({
      where: { id: user1.body.id },
    });
    const updatedUser2 = await prismaService.user.findUnique({
      where: { id: user2.body.id },
    });

    expect(updatedUser1?.balance.toNumber()).toBe(1000);
    expect(updatedUser2?.balance.toNumber()).toBe(0);
  });
});
