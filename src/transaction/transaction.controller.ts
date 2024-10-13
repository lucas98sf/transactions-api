import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ description: 'Transaction successfully created' })
  create(
    @Request() req: { user: { userId: string } },
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.transferMoney(
      req.user.userId,
      createTransactionDto.recipientId,
      createTransactionDto.amount,
    );
  }

  @Post(':id/reverse')
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ description: 'Transaction successfully reversed' })
  reverse(@Param('id') id: string) {
    return this.transactionService.reverseTransaction(id);
  }
}
