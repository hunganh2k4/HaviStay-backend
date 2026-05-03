import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VerificationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PENDING COUNTS (for notification badges) ───────────────────────────────
  async getPendingCounts() {
    const [pendingHosts, pendingProperties] = await Promise.all([
      this.prisma.hostVerification.count({
        where: { status: VerificationStatus.PENDING },
      }),
      this.prisma.property.count({
        where: { isPublished: false },
      }),
    ]);

    return { pendingHosts, pendingProperties };
  }

  // ─── HOST VERIFICATIONS ──────────────────────────────────────────────────────
  async getHostVerifications(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status as VerificationStatus;
    }

    return this.prisma.hostVerification.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewHostVerification(
    verificationId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNote?: string,
  ) {
    const verification = await this.prisma.hostVerification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException('Host verification not found');
    }

    const updatedVerification = await this.prisma.hostVerification.update({
      where: { id: verificationId },
      data: { status, reviewNote },
    });

    let updatedUser = verification.user;

    if (status === 'APPROVED') {
      updatedUser = await this.prisma.user.update({
        where: { id: verification.userId },
        data: { role: Role.HOST },
      });
    }

    return {
      message: `Verification request has been ${status.toLowerCase()}`,
      verification: updatedVerification,
      user: updatedUser,
    };
  }

  // ─── PROPERTIES ──────────────────────────────────────────────────────────────
  async getProperties(published?: string) {
    const where: any = {};
    if (published === 'false') {
      where.isPublished = false;
    } else if (published === 'true') {
      where.isPublished = true;
    }

    return this.prisma.property.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        rooms: { select: { id: true, pricePerNight: true } },
        _count: { select: { reviews: true, rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async togglePropertyPublish(propertyId: string, isPublished: boolean) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { isPublished },
    });
  }

  // ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
  async getDashboardStats() {
    const [totalUsers, totalProperties, totalBookings, totalRevenue] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.property.count(),
        this.prisma.booking.count(),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'PAID' },
        }),
      ]);

    return {
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }
}
