import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { SupabaseService } from '../supabase/supabase.service';

import { RoomsService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly supabaseService: SupabaseService,
  ) { }

  // CREATE ROOM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: memoryStorage(),
  }))
  async create(
    @Req() req: any,
    @Body() dto: CreateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Make sure numbers are parsed correctly if sent as strings in FormData
    if (typeof dto.pricePerNight === 'string') dto.pricePerNight = Number(dto.pricePerNight);
    if (typeof dto.cleaningFee === 'string') dto.cleaningFee = Number(dto.cleaningFee);
    if (typeof dto.serviceFee === 'string') dto.serviceFee = Number(dto.serviceFee);
    if (typeof dto.guests === 'string') dto.guests = Number(dto.guests);
    if (typeof dto.bedrooms === 'string') dto.bedrooms = Number(dto.bedrooms);
    if (typeof dto.beds === 'string') dto.beds = Number(dto.beds);
    if (typeof dto.bathrooms === 'string') dto.bathrooms = Number(dto.bathrooms);

    let uploadedImages: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.supabaseService.uploadFile(file));
      uploadedImages = await Promise.all(uploadPromises);
    }
    
    // Merge uploaded images with existing ones if any (though usually create has no existing ones)
    dto.images = Array.isArray(dto.images) ? [...dto.images, ...uploadedImages] : uploadedImages;

    return this.roomsService.create(
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // GET ALL ROOMS BY PROPERTY
  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.roomsService.findByProperty(
      propertyId,
    );
  }

  // GET ROOM DETAIL
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  // UPDATE ROOM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: memoryStorage(),
  }))
  async update(
    @Param('id') roomId: string,
    @Req() req: any,
    @Body() dto: UpdateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (typeof dto.pricePerNight === 'string') dto.pricePerNight = Number(dto.pricePerNight);
    if (typeof dto.cleaningFee === 'string') dto.cleaningFee = Number(dto.cleaningFee);
    if (typeof dto.serviceFee === 'string') dto.serviceFee = Number(dto.serviceFee);
    if (typeof dto.guests === 'string') dto.guests = Number(dto.guests);
    if (typeof dto.bedrooms === 'string') dto.bedrooms = Number(dto.bedrooms);
    if (typeof dto.beds === 'string') dto.beds = Number(dto.beds);
    if (typeof dto.bathrooms === 'string') dto.bathrooms = Number(dto.bathrooms);

    let uploadedImages: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.supabaseService.uploadFile(file));
      uploadedImages = await Promise.all(uploadPromises);
    }

    // Convert existing images from string to array if only one existing image string is passed
    if (typeof dto.images === 'string') {
      dto.images = [dto.images];
    } else if (!dto.images) {
      dto.images = [];
    }
    
    dto.images = [...dto.images, ...uploadedImages];

    return this.roomsService.update(
      roomId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // DELETE ROOM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Delete(':id')
  delete(
    @Param('id') roomId: string,
    @Req() req: any,
  ) {
    return this.roomsService.delete(
      roomId,
      req.user.userId,
      req.user.role,
    );
  }
}