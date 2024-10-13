import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty()
  @IsString()
  recipientId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;
}
