import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // CREATE ROOM
  async create(
    userId: string,
    role: string,
    dto: CreateRoomDto,
  ) {
    // 1. Check property exists
    const property =
      await this.prisma.property.findUnique({
        where: {
          id: dto.propertyId,
        },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    // 2. Check ownership
    if (
      property.hostId !== userId &&
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You can only add rooms to your own property',
      );
    }

    // 3. Create room
    return this.prisma.room.create({
      data: {
        propertyId: dto.propertyId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        pricePerNight: dto.pricePerNight,
        cleaningFee: dto.cleaningFee,
        serviceFee: dto.serviceFee,
        guests: dto.guests,
        bedrooms: dto.bedrooms,
        beds: dto.beds,
        bathrooms: dto.bathrooms,
        images: dto.images,
      },
    });
  }

  // GET ALL ROOMS BY PROPERTY
  async findByProperty(
    propertyId: string,
  ) {
    // Check property exists
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

    return this.prisma.room.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // GET ROOM DETAIL
  async findOne(roomId: string) {
    const room =
      await this.prisma.room.findUnique({
        where: {
          id: roomId,
        },
        include: {
          property: {
            include: {
              host: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  phone: true,
                },
              },
            },
          },
          bookings: true,
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    return room;
  }

  // UPDATE ROOM
  async update(
    roomId: string,
    userId: string,
    role: string,
    dto: UpdateRoomDto,
  ) {
    // 1. Check room exists
    const room =
      await this.prisma.room.findUnique({
        where: {
          id: roomId,
        },
        include: {
          property: true,
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    // 2. Check ownership
    if (
      room.property.hostId !== userId &&
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You can only update your own room',
      );
    }

    // 3. Update room
    return this.prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        ...dto,
      },
    });
  }

  // DELETE ROOM
  async delete(
    roomId: string,
    userId: string,
    role: string,
  ) {
    // 1. Check room exists
    const room =
      await this.prisma.room.findUnique({
        where: {
          id: roomId,
        },
        include: {
          property: true,
        },
      });

    if (!room) {
      throw new NotFoundException(
        'Room not found',
      );
    }

    // 2. Check ownership
    if (
      room.property.hostId !== userId &&
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'You can only delete your own room',
      );
    }

    // 3. Optional:
    // Prevent deleting room if active bookings exist
    const activeBookings =
      await this.prisma.booking.count({
        where: {
          roomId,
          status: {
            in: [
              'PENDING',
              'CONFIRMED',
            ],
          },
        },
      });

    if (activeBookings > 0) {
      throw new ForbiddenException(
        'Cannot delete room with active bookings',
      );
    }

    // 4. Delete room
    return this.prisma.room.delete({
      where: {
        id: roomId,
      },
    });
  }
}