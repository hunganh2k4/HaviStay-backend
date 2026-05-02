import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VerificationStatus } from '@prisma/client';
import { BecomeHostDto } from './dto/become-host.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) { }

  async becomeHost(userId: string, dto: BecomeHostDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if there is already a pending verification
    const existingPending = await this.prisma.hostVerification.findFirst({
      where: { userId, status: VerificationStatus.PENDING },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending host verification request.');
    }

    // Create HostVerification record
    const verification = await this.prisma.hostVerification.create({
      data: {
        userId,
        verificationType: dto.verificationType,
        fullName: dto.fullName,
        cccdNumber: dto.cccdNumber,
        cccdFrontImage: dto.cccdFrontImage,
        cccdBackImage: dto.cccdBackImage,
        selfieImage: dto.selfieImage,
        companyName: dto.companyName,
        taxCode: dto.taxCode,
        legalRepresentative: dto.legalRepresentative,
        representativeCCCD: dto.representativeCCCD,
        businessLicense: dto.businessLicense,
        status: VerificationStatus.PENDING,
      },
    });

    // Optionally update user's phone if provided
    if (dto.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    return {
      message: 'Your request to become a host is pending review by the admin.',
      verificationId: verification.id,
      status: verification.status,
    };
  }

  async verifyHost(verificationId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) {
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

    // If approved, update user role to HOST
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
}
