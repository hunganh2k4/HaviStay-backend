import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VerificationStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ─── PENDING COUNTS (for notification badges) ───────────────────────────────
  async getPendingCounts() {
    const [pendingHosts, pendingProperties] = await Promise.all([
      this.prisma.hostVerification.count({
        where: { status: VerificationStatus.PENDING },
      }),
      this.prisma.property.count({
        where: { verificationStatus: VerificationStatus.PENDING },
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

    if (updatedUser.email) {
      await this.mailService.sendHostVerificationStatusEmail(
        updatedUser.email,
        status,
        reviewNote
      );
    }

    return {
      message: `Verification request has been ${status.toLowerCase()}`,
      verification: updatedVerification,
      user: updatedUser,
    };
  }

  // ─── PROPERTIES ──────────────────────────────────────────────────────────────
  async getProperties(verificationStatus?: string) {
    const where: any = {};
    if (verificationStatus) {
      where.verificationStatus = verificationStatus as VerificationStatus;
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

  async verifyProperty(propertyId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { host: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: { 
        verificationStatus: status,
        isPublished: status === 'APPROVED',
        reviewNote: status === 'REJECTED' ? reviewNote : null,
      },
    });

    if (property.host?.email) {
      await this.mailService.sendPropertyVerificationStatusEmail(
        property.host.email,
        property.title,
        status,
        reviewNote
      );
    }

    return updatedProperty;
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
