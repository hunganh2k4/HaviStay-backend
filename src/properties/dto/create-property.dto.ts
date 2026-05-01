import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  location: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsArray()
  images: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}