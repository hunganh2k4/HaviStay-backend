import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import moment from 'moment';
import * as qs from 'qs';

@Injectable()
export class VnpayService {
  constructor(private configService: ConfigService) { }

  createPaymentUrl(params: {
    amount: number;
    bookingId: string;
    ipAddr: string;
  }) {
    const tmnCode = this.configService.get('VNPAY_TMN_CODE');
    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = `${this.configService.get('APP_URL')}/payments/vnpay-return`;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    const vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = params.bookingId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan dat phong HaviStay: ' + params.bookingId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = params.amount * 100; // VNPAY expects amount * 100
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = params.ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort params
    const sortedParams = this.sortObject(vnp_Params);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(sortedParams, { encode: false });

    return vnpUrl;
  }

  verifyReturnUrl(vnp_Params: any) {
    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    const vnp_SecureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return signed === vnp_SecureHash;
  }

  private sortObject(obj: any) {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
  }
}
