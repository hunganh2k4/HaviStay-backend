import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyServiceDto } from './dto/create-property-service.dto';
import { UpdatePropertyServiceDto } from './dto/update-property-service.dto';

@Injectable()
export class PropertyServicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, role: string, dto: CreatePropertyServiceDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('You can only add services to your own property');
    }

    return this.prisma.propertyService.create({
      data: dto,
    });
  }

  async findAllByProperty(propertyId: string) {
    return this.prisma.propertyService.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.propertyService.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, userId: string, role: string, dto: UpdatePropertyServiceDto) {
    const service = await this.prisma.propertyService.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.property.hostId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('You can only update services of your own property');
    }

    return this.prisma.propertyService.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string, role: string) {
    const service = await this.prisma.propertyService.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.property.hostId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete services of your own property');
    }

    return this.prisma.propertyService.delete({
      where: { id },
    });
  }
}
