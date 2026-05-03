import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) { }

  async toggleWishlist(userId: string, propertyId: string) {
    // 1. Check if property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // 2. Check if already in wishlist
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existing) {
      // Remove
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { isWishlisted: false };
    } else {
      // Add
      await this.prisma.wishlist.create({
        data: {
          userId,
          propertyId,
        },
      });
      return { isWishlisted: true };
    }
  }

  async getMyWishlist(userId: string) {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            rooms: {
              orderBy: { pricePerNight: 'asc' },
              take: 1,
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wishlist.map((item) => ({
      ...item.property,
      id: item.propertyId, // Ensure ID is consistent
      isWishlisted: true,
    }));
  }

  async checkStatus(userId: string, propertyId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
    return { isWishlisted: !!existing };
  }
}
