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

import { PropertiesService } from './properties.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly supabaseService: SupabaseService,
  ) { }

  // CREATE PROPERTY
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: memoryStorage(),
  }))
  async create(
    @Req() req: any,
    @Body() dto: CreatePropertyDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.supabaseService.uploadFile(file));
      dto.images = await Promise.all(uploadPromises);
    }
    return this.propertiesService.create(
      req.user.userId,
      dto,
    );
  }

  // GET ALL PUBLIC PROPERTIES
  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  // GET MY PROPERTIES
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Get('my-properties')
  myProperties(@Req() req: any) {
    return this.propertiesService.myProperties(
      req.user.userId,
      req.user.role,
    );
  }

  // GET PROPERTY DETAIL
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // UPDATE PROPERTY
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(
      id,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // REQUEST VERIFICATION
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Patch(':id/request-verification')
  requestVerification(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.propertiesService.requestVerification(
      id,
      req.user.userId,
    );
  }

  // DELETE PROPERTY
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.propertiesService.delete(
      id,
      req.user.userId,
      req.user.role,
    );
  }
}