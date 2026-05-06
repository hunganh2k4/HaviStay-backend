import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PropertyServicesService } from './property-services.service';
import { CreatePropertyServiceDto } from './dto/create-property-service.dto';
import { UpdatePropertyServiceDto } from './dto/update-property-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('property-services')
export class PropertyServicesController {
  constructor(
    private readonly propertyServicesService: PropertyServicesService,
    private readonly supabaseService: SupabaseService,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Req() req: any,
    @Body() createPropertyServiceDto: CreatePropertyServiceDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.supabaseService.uploadFile(file));
      createPropertyServiceDto.images = await Promise.all(uploadPromises);
    }

    // Handle string to number conversion if sent via FormData
    if (createPropertyServiceDto.price) {
      createPropertyServiceDto.price = Number(createPropertyServiceDto.price);
    }

    if (createPropertyServiceDto.isAvailable !== undefined) {
      createPropertyServiceDto.isAvailable = String(createPropertyServiceDto.isAvailable) === 'true';
    }

    return this.propertyServicesService.create(req.user.userId, req.user.role, createPropertyServiceDto);
  }

  @Get('property/:propertyId')
  findAllByProperty(@Param('propertyId') propertyId: string) {
    return this.propertyServicesService.findAllByProperty(propertyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyServicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updatePropertyServiceDto: UpdatePropertyServiceDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.supabaseService.uploadFile(file));
      const uploadedImages = await Promise.all(uploadPromises);

      if (typeof updatePropertyServiceDto.images === 'string') {
        updatePropertyServiceDto.images = [updatePropertyServiceDto.images];
      } else if (!updatePropertyServiceDto.images) {
        updatePropertyServiceDto.images = [];
      }

      updatePropertyServiceDto.images = [...updatePropertyServiceDto.images, ...uploadedImages];
    }

    if (updatePropertyServiceDto.price) {
      updatePropertyServiceDto.price = Number(updatePropertyServiceDto.price);
    }

    if (updatePropertyServiceDto.isAvailable !== undefined) {
      updatePropertyServiceDto.isAvailable = String(updatePropertyServiceDto.isAvailable) === 'true';
    }

    return this.propertyServicesService.update(id, req.user.userId, req.user.role, updatePropertyServiceDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.propertyServicesService.remove(id, req.user.userId, req.user.role);
  }
}
