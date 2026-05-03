import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, propertyId: string, data: { rating: number; comment: string; images?: string[] }) {
    // 1. Check if user has a confirmed booking for this property
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId,
        room: {
          propertyId,
        },
        status: 'CONFIRMED',
      },
    });

    if (!booking) {
      throw new BadRequestException('Bạn phải hoàn thành đặt phòng và thanh toán mới có thể đánh giá.');
    }

    // 2. Check if user already reviewed this property
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existingReview) {
      // Update existing review instead of creating new one
      return this.prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: data.rating,
          comment: data.comment,
          images: data.images || [],
        },
      });
    }

    // 3. Create review
    return this.prisma.review.create({
      data: {
        userId,
        propertyId,
        rating: data.rating,
        comment: data.comment,
        images: data.images || [],
      },
    });
  }

  async getPropertyReviews(propertyId: string) {
    return this.prisma.review.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new BadRequestException('Unauthorized');

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  async getUserReviewForProperty(userId: string, propertyId: string) {
    return this.prisma.review.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
  }
}
