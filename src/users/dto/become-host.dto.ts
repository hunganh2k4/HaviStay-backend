import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
  IsEnum,
} from 'class-validator';
import { VerificationType } from '@prisma/client';

export class BecomeHostDto {
  @IsEnum(VerificationType)
  @IsNotEmpty()
  verificationType: VerificationType;

  // SĐT Việt Nam: 10 số, bắt đầu bằng 03,05,07,08,09 hoặc +84
  @IsString()
  @IsOptional()
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone?: string;

  // PERSONAL fields
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  @Length(12, 12, { message: 'CCCD phải gồm đúng 12 chữ số' })
  @Matches(/^[0-9]{12}$/, { message: 'CCCD chỉ được chứa số' })
  cccdNumber?: string;

  // BUSINESS fields
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  taxCode?: string;

  @IsString()
  @IsOptional()
  legalRepresentative?: string;

  @IsString()
  @IsOptional()
  @Length(12, 12, { message: 'CCCD người đại diện phải gồm đúng 12 chữ số' })
  @Matches(/^[0-9]{12}$/, { message: 'CCCD người đại diện chỉ được chứa số' })
  representativeCCCD?: string;

  // File URLs (these will be populated by the controller after upload)
  @IsString()
  @IsOptional()
  cccdFrontImage?: string;

  @IsString()
  @IsOptional()
  cccdBackImage?: string;

  @IsString()
  @IsOptional()
  selfieImage?: string;

  @IsString()
  @IsOptional()
  businessLicense?: string;
}