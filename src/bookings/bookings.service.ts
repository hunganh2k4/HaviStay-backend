import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateBookingDto) {
    // 1. Check if room exists
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // 2. Check room availability (Basic check for now, can be improved)
    // For now we just create the booking.

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = (room.pricePerNight * nights) + room.cleaningFee + room.serviceFee;

    // 3. Create booking
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        roomId: dto.roomId,
        checkIn,
        checkOut,
        nights,
        guestsCount: dto.guestsCount,
        totalPrice,
        status: 'PENDING',
      },
    });

    return booking;
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            property: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getMyBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check review status for each booking's property
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const review = await this.prisma.review.findUnique({
          where: {
            userId_propertyId: {
              userId,
              propertyId: booking.room.propertyId,
            },
          },
        });
        return {
          ...booking,
          isReviewed: !!review,
          reviewId: review?.id,
        };
      }),
    );

    return bookingsWithReviewStatus;
  }
}
