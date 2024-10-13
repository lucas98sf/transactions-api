import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            getUsers: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: '1',
        balance: new Prisma.Decimal(0),
        ...createUserDto,
      };

      jest.spyOn(userService, 'create').mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(createdUser);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: '1',
          email: 'user1@email.com',
          balance: new Prisma.Decimal(0),
          sentTransactions: [],
          receivedTransactions: [],
        },
        {
          id: '2',
          email: 'user2@email.com',
          balance: new Prisma.Decimal(0),
          sentTransactions: [],
          receivedTransactions: [],
        },
      ];

      jest.spyOn(userService, 'getUsers').mockResolvedValue(users);

      const result = await controller.getUsers();

      expect(result).toEqual(users);
      expect(userService.getUsers).toHaveBeenCalled();
    });
  });
});
