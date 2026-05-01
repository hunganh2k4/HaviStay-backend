import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  propertyId: string;

  @IsString()
  name: string;

  @IsEnum([
    'STANDARD',
    'VIP',
    'DELUXE',
    'SUITE',
  ])
  type:
    | 'STANDARD'
    | 'VIP'
    | 'DELUXE'
    | 'SUITE';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  pricePerNight: number;

  @IsOptional()
  @IsNumber()
  cleaningFee?: number;

  @IsOptional()
  @IsNumber()
  serviceFee?: number;

  @IsNumber()
  guests: number;

  @IsNumber()
  bedrooms: number;

  @IsNumber()
  beds: number;

  @IsNumber()
  bathrooms: number;

  @IsArray()
  images: string[];
}