import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class BecomeHostDto {
  // SĐT Việt Nam: 10 số, bắt đầu bằng 03,05,07,08,09 hoặc +84
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, {
    message:
      'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (VD: 0912345678 hoặc +84912345678)',
  })
  phone: string;

  // CCCD Việt Nam: đúng 12 số
  @IsString()
  @IsNotEmpty()
  @Length(12, 12, {
    message: 'CCCD phải gồm đúng 12 chữ số',
  })
  @Matches(/^[0-9]{12}$/, {
    message: 'CCCD chỉ được chứa số',
  })
  cccdNumber: string;

  // URL ảnh CCCD (nếu có)
  @IsString()
  @IsOptional()
  cccdImage?: string;
}