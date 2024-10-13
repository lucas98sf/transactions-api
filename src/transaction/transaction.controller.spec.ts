import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Prisma } from '@prisma/client';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            transferMoney: jest.fn(),
            reverseTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const createTransactionDto: CreateTransactionDto = {
        recipientId: '2',
        amount: 100,
      };

      const req = { user: { userId: '1' } };

      const createdTransaction = {
        id: '1',
        senderId: '1',
        ...createTransactionDto,
        amount: new Prisma.Decimal(createTransactionDto.amount),
        createdAt: new Date(),
        reversed: false,
      };

      jest
        .spyOn(transactionService, 'transferMoney')
        .mockResolvedValue(createdTransaction);

      const result = await controller.create(req, createTransactionDto);

      expect(result).toEqual(createdTransaction);
      expect(transactionService.transferMoney).toHaveBeenCalledWith(
        req.user.userId,
        createTransactionDto.recipientId,
        createTransactionDto.amount,
      );
    });
  });

  describe('reverse', () => {
    it('should reverse a transaction', async () => {
      const transactionId = '1';
      const reversedTransaction = {
        id: '1',
        senderId: '1',
        recipientId: '2',
        amount: new Prisma.Decimal(100),
        createdAt: new Date(),
        reversed: true,
      };

      jest
        .spyOn(transactionService, 'reverseTransaction')
        .mockResolvedValue(reversedTransaction);

      const result = await controller.reverse(transactionId);

      expect(result).toEqual(reversedTransaction);
      expect(transactionService.reverseTransaction).toHaveBeenCalledWith(
        transactionId,
      );
    });
  });
});
