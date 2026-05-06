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
    let totalPrice = (room.pricePerNight * nights) + room.cleaningFee + room.serviceFee;

    // 2.1 Calculate services price
    const selectedServicesData: any[] = [];
    if (dto.selectedServices && dto.selectedServices.length > 0) {
      for (const item of dto.selectedServices) {
        const service = await this.prisma.propertyService.findUnique({
          where: { id: item.serviceId },
        });

        if (service && service.isAvailable) {
          totalPrice += service.price * item.quantity;
          selectedServicesData.push({
            propertyServiceId: service.id,
            quantity: item.quantity,
            priceAtBooking: service.price,
          });
        }
      }
    }

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
        bookingServices: {
          create: selectedServicesData,
        },
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
        bookingServices: {
          include: {
            propertyService: true,
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
        bookingServices: {
          include: {
            propertyService: true,
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

  async getHostEarnings(hostId: string) {
    // Get all CONFIRMED/COMPLETED bookings for rooms belonging to this host
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        room: {
          property: { hostId },
        },
      },
      include: {
        room: {
          include: {
            property: {
              select: { id: true, title: true, images: true },
            },
          },
        },
      },
      orderBy: { checkIn: 'asc' },
    });

    const now = new Date();

    // 1. Monthly (Last 12 months)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `Thg ${d.getMonth() + 1}/${d.getFullYear()}`,
        revenue: 0,
      };
    });

    // 2. Weekly (Last 12 weeks)
    const weeklyRevenue = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (11 - i) * 7);
      // Get the start of that week (Monday)
      const day = d.getDay() || 7;
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - day + 1);
      return {
        key: d.toISOString().split('T')[0],
        label: `Tuần ${d.getDate()}/${d.getMonth() + 1}`,
        revenue: 0,
        date: new Date(d),
      };
    });

    // 3. Day of Week (Mon-Sun)
    const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dayOfWeekRevenue = daysOfWeek.map((label) => ({
      label,
      revenue: 0,
    }));

    // Per-property earnings
    const propertyMap = new Map<string, any>();
    let totalRevenue = 0;
    let totalNights = 0;

    for (const booking of bookings) {
      const revenue = Number(booking.totalPrice);
      totalRevenue += revenue;
      totalNights += booking.nights;

      const checkInDate = new Date(booking.checkIn);

      // Add to Monthly
      const monthKey = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}`;
      const mMatch = monthlyRevenue.find((m) => m.key === monthKey);
      if (mMatch) mMatch.revenue += revenue;

      // Add to Weekly
      const weekMatch = weeklyRevenue.slice().reverse().find(w => checkInDate >= w.date);
      if (weekMatch) weekMatch.revenue += revenue;

      // Add to Day of Week
      const dayIdx = (checkInDate.getDay() + 6) % 7; // Mon=0, Sun=6
      dayOfWeekRevenue[dayIdx].revenue += revenue;

      // Add to Per Property
      const prop = booking.room.property;
      if (!propertyMap.has(prop.id)) {
        propertyMap.set(prop.id, {
          id: prop.id,
          title: prop.title,
          image: prop.images?.[0] || '',
          revenue: 0,
          bookings: 0,
          nights: 0,
        });
      }
      const pEntry = propertyMap.get(prop.id);
      pEntry.revenue += revenue;
      pEntry.bookings += 1;
      pEntry.nights += booking.nights;
    }

    const bestMonth = monthlyRevenue.reduce(
      (best, m) => (m.revenue > best.revenue ? m : best),
      monthlyRevenue[0],
    );

    return {
      totalRevenue,
      totalBookings: bookings.length,
      totalNights,
      avgRevenuePerBooking:
        bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
      bestMonth: bestMonth.revenue > 0 ? bestMonth : null,
      monthlyRevenue,
      weeklyRevenue,
      dayOfWeekRevenue,
      byProperty: Array.from(propertyMap.values()).sort(
        (a, b) => b.revenue - a.revenue,
      ),
    };
  }
}
