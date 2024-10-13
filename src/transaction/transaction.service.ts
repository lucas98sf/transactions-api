import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  constructor(private prisma: PrismaService) {}

  async transferMoney(senderId: string, recipientId: string, amount: number) {
    return this.prisma.$transaction(async (prisma) => {
      const sender = await prisma.user.findUnique({ where: { id: senderId } });
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!sender || !recipient) {
        this.logger.error(
          `Sender ${senderId} or recipient ${recipientId} not found`,
        );
        throw new BadRequestException('Sender or recipient not found');
      }

      if (sender.balance.toNumber() < amount) {
        this.logger.error(
          `Insufficient balance ${sender.balance.toNumber()} of ${senderId}`,
        );
        throw new BadRequestException('Insufficient balance');
      }

      await prisma.user.update({
        where: { id: senderId },
        data: { balance: { decrement: amount } },
      });

      await prisma.user.update({
        where: { id: recipientId },
        data: { balance: { increment: amount } },
      });

      const transaction = await prisma.transaction.create({
        data: {
          senderId,
          recipientId,
          amount: new Prisma.Decimal(amount),
        },
      });
      this.logger.log(
        `Transaction created: ${senderId} sent ${amount} to ${recipientId}`,
      );
      return transaction;
    });
  }

  async reverseTransaction(transactionId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { sender: true, recipient: true },
      });

      if (!transaction || transaction.reversed) {
        this.logger.error(
          `Transaction ${transactionId} not found or already reversed`,
        );
        throw new BadRequestException(
          'Transaction not found or already reversed',
        );
      }

      await prisma.user.update({
        where: { id: transaction.senderId },
        data: { balance: { increment: transaction.amount } },
      });

      await prisma.user.update({
        where: { id: transaction.recipientId },
        data: { balance: { decrement: transaction.amount } },
      });

      const update = await prisma.transaction.update({
        where: { id: transactionId },
        data: { reversed: true },
      });
      this.logger.log(`Transaction reversed: ${transactionId}`);
      return update;
    });
  }
}
