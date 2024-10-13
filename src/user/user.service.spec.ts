import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const createdUser = {
        ...createUserDto,
        id: '1',
        balance: new Prisma.Decimal(0),
        password: hashedPassword,
      };

      jest.spyOn(prismaService.user, 'create').mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(createdUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: expect.any(String),
        },
      });
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        balance: new Prisma.Decimal(0),
      };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });
});
