import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';

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
}
