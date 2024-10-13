import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async transferMoney(senderId: string, recipientId: string, amount: number) {
    return this.prisma.$transaction(async (prisma) => {
      const sender = await prisma.user.findUnique({ where: { id: senderId } });
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!sender || !recipient) {
        throw new BadRequestException('Sender or recipient not found');
      }

      if (sender.balance.toNumber() < amount) {
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

      return prisma.transaction.create({
        data: {
          senderId,
          recipientId,
          amount: new Prisma.Decimal(amount),
        },
      });
    });
  }

  async reverseTransaction(transactionId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { sender: true, recipient: true },
      });

      if (!transaction || transaction.reversed) {
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

      return prisma.transaction.update({
        where: { id: transactionId },
        data: { reversed: true },
      });
    });
  }
}
