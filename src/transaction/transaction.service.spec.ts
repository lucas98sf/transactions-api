import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transferMoney', () => {
    it('should transfer money successfully', async () => {
      const sender = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        balance: new Prisma.Decimal(1000),
      };
      const recipient = {
        id: '2',
        email: 'test2@example.com',
        password: 'hashedPassword',
        balance: new Prisma.Decimal(500),
      };
      const amount = 100;

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(recipient);

      jest.spyOn(prismaService.user, 'update');
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        id: '1',
        senderId: sender.id,
        recipientId: recipient.id,
        amount: new Prisma.Decimal(amount),
        createdAt: new Date(),
        reversed: false,
      });

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation((callback: any) => callback(prismaService));

      await service.transferMoney(sender.id, recipient.id, amount);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: sender.id },
        data: { balance: { decrement: amount } },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: recipient.id },
        data: { balance: { increment: amount } },
      });
      expect(prismaService.transaction.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when sender has insufficient balance', async () => {
      const sender = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        balance: new Prisma.Decimal(50),
      };
      const recipient = {
        id: '2',
        email: 'test2@example.com',
        password: 'hashedPassword',
        balance: new Prisma.Decimal(500),
      };
      const amount = 100;

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(recipient);

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation((callback: any) => callback(prismaService));

      await expect(
        service.transferMoney(sender.id, recipient.id, amount),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reverseTransaction', () => {
    it('should reverse a transaction successfully', async () => {
      const transaction = {
        id: '1',
        senderId: '1',
        recipientId: '2',
        amount: new Prisma.Decimal(100),
        reversed: false,
        createdAt: new Date(),
      };

      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(transaction);
      jest.spyOn(prismaService.user, 'update');
      jest
        .spyOn(prismaService.transaction, 'update')
        .mockResolvedValue({ ...transaction, reversed: true });

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation((callback: any) => callback(prismaService));

      await service.reverseTransaction(transaction.id);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: transaction.senderId },
        data: { balance: { increment: transaction.amount } },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: transaction.recipientId },
        data: { balance: { decrement: transaction.amount } },
      });
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: transaction.id },
        data: { reversed: true },
      });
    });

    it('should throw BadRequestException when transaction is already reversed', async () => {
      const transaction = {
        id: '1',
        senderId: '1',
        recipientId: '2',
        amount: new Prisma.Decimal(100),
        reversed: true,
        createdAt: new Date(),
      };

      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(transaction);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation((callback: any) => callback(prismaService));

      await expect(service.reverseTransaction(transaction.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
