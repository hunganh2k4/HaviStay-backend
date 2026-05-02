import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
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

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.HOST,
        phone: dto.phone,
        cccdNumber: dto.cccdNumber,
        cccdImage: dto.cccdImage,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        cccdNumber: true,
        cccdImage: true,
        role: true,
      },
    });

    const access_token = this.authService.generateToken(updatedUser);

    return {
      message: 'You are now a host',
      access_token,
      user: updatedUser,
    };
  }
}
