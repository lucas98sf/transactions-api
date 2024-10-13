import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return a JWT token', async () => {
      const user = { id: '1', email: 'test@example.com' };
      const token = { access_token: 'jwt-token' };

      jest.spyOn(authService, 'login').mockResolvedValue(token);

      const result = await controller.login({ user });

      expect(result).toEqual(token);
      expect(authService.login).toHaveBeenCalledWith(user);
    });
  });
});
