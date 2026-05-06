import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsDateString()
  checkIn: string;

  @IsNotEmpty()
  @IsDateString()
  checkOut: string;

  @IsNotEmpty()
  @IsNumber()
  guestsCount: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedServiceDto)
  selectedServices?: SelectedServiceDto[];
}

export class SelectedServiceDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
