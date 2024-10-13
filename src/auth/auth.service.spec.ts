import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        balance: new Prisma.Decimal(0),
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        balance: new Prisma.Decimal(0),
      });
    });

    it('should return null when credentials are invalid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        balance: new Prisma.Decimal(0),
        password: await bcrypt.hash('password123', 10),
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token when credentials are valid', async () => {
      const user = { id: '1', email: 'test@example.com' };
      const token = 'jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
    });
  });
});
