import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // CREATE PROPERTY
  async create(
    userId: string,
    dto: CreatePropertyDto,
  ) {
    return this.prisma.property.create({
      data: {
        ...dto,
        hostId: userId,
      },
    });
  }

  // GET ALL
  async findAll() {
    return this.prisma.property.findMany({
      where: {
        isPublished: true,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        rooms: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // GET ONE
  async findOne(propertyId: string) {
    const property =
      await this.prisma.property.findUnique({
        where: {
          id: propertyId,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
            },
          },
          rooms: true,
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return property;
  }

  // MY PROPERTIES
  async myProperties(userId: string, role: string) {
    const where: any = {};
    if (role !== 'ADMIN') {
      where.hostId = userId;
    }

    return this.prisma.property.findMany({
      where,
      include: {
        rooms: true,
        reviews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // UPDATE
  async update(
    propertyId: string,
    userId: string,
    role: string,
    dto: UpdatePropertyDto,
  ) {
    const property =
      await this.prisma.property.findUnique({
        where: {
          id: propertyId,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    // Ownership check
    if (
      property.hostId !== userId &&
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You can only update your own property',
      );
    }

    return this.prisma.property.update({
      where: {
        id: propertyId,
      },
      data: dto,
    });
  }

  // REQUEST VERIFICATION
  async requestVerification(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== userId) {
      throw new ForbiddenException('You can only request verification for your own property');
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        verificationStatus: 'PENDING',
        reviewNote: null,
      },
    });
  }

  // DELETE
  async delete(
    propertyId: string,
    userId: string,
    role: string,
  ) {
    const property =
      await this.prisma.property.findUnique({
        where: {
          id: propertyId,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    // Ownership check
    if (
      property.hostId !== userId &&
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You can only delete your own property',
      );
    }

    return this.prisma.property.delete({
      where: {
        id: propertyId,
      },
    });
  }
}