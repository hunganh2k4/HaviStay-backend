import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { VnpayService } from './vnpay.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, VnpayService, PrismaService, ConfigService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
