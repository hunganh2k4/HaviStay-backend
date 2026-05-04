import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('create-vnpay-url')
  async createVnpayUrl(
    @Req() req: any,
    @Body('bookingId') bookingId: string,
  ) {
    let ipAddr =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';

    if (ipAddr === '::1') ipAddr = '127.0.0.1';

    const url = await this.paymentsService.createVnpayUrl(
      req.user.userId,
      bookingId,
      ipAddr,
    );

    return { url };
  }

  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: any) {
    const result = await this.paymentsService.handleVnpayReturn(query);

    // Redirect to frontend with status
    const frontendUrl = this.configService
      .get('FRONTEND_URL')
      .split(',')[0]
      .trim();

    const redirectUrl = `${frontendUrl}/payment-result?success=${result.success}&bookingId=${result.bookingId}`;

    return res.redirect(redirectUrl);
  }
}