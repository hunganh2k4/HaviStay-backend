import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VnpayService } from './vnpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
  ) { }

  async createVnpayUrl(userId: string, bookingId: string, ipAddr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Create or update payment record
    const payment = await this.prisma.payment.upsert({
      where: { bookingId },
      update: {
        amount: booking.totalPrice,
        status: 'PENDING',
      },
      create: {
        userId,
        bookingId,
        amount: booking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
      },
    });

    return this.vnpayService.createPaymentUrl({
      amount: booking.totalPrice,
      bookingId: booking.id,
      ipAddr,
    });
  }

  async handleVnpayReturn(vnp_Params: any) {
    const isValid = this.vnpayService.verifyReturnUrl({ ...vnp_Params });
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    const bookingId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];

    if (responseCode === '00') {
      // Success
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { bookingId },
          data: {
            status: 'PAID',
            transactionId: transactionNo,
            provider: 'VNPAY',
          },
        }),
        this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' },
        }),
      ]);
      return { success: true, bookingId };
    } else {
      // Failed
      await this.prisma.payment.update({
        where: { bookingId },
        data: { status: 'FAILED' },
      });
      return { success: false, bookingId };
    }
  }
}
