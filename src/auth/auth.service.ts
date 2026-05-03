import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { parseExpiryToSeconds } from '../utils/parse-expiry.util';

import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) { }

  // REGISTER + SEND VERIFY EMAIL
  async register(dto: RegisterDto) {
    console.log('REGISTER START');

    // Check existing email
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    console.log('STEP 1: Email available');

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create inactive user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        isEmailVerified: false,
      },
    });

    console.log('STEP 2: User created', user.email);

    // Generate verification token
    const token = randomBytes(32).toString('hex');

    console.log('STEP 3: Token generated', token);

    // Save token to DB
    await this.prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        type: 'VERIFY_EMAIL',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    console.log('STEP 4: Token saved to DB');

    // Send verification email
    console.log('STEP 5: About to call MailService');

    try {
      const mailResult = await this.mailService.sendVerificationEmail(
        user.email,
        token,
      );

      console.log('STEP 6: MailService success', mailResult);
    } catch (error) {
      console.error('MAIL ERROR:', error);
    }

    return {
      message: 'Register successful. Please verify your email.',
    };
  }

  // VERIFY EMAIL
  async verifyEmail(token: string) {
    const verificationRecord =
      await this.prisma.verificationToken.findUnique({
        where: {
          token,
        },
      });

    if (!verificationRecord) {
      throw new BadRequestException('Invalid token');
    }

    if (verificationRecord.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    await this.prisma.user.update({
      where: {
        email: verificationRecord.email,
      },
      data: {
        isEmailVerified: true,
      },
    });

    await this.prisma.verificationToken.delete({
      where: {
        token,
      },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  // LOGIN
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate tokens
    const access_token = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

    // Store refresh token in Redis (with expiration)
    const refreshExpiresIn = parseExpiryToSeconds(
      process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    );
    await this.redisService.set(
      `refresh_token:${user.id}:${refresh_token}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      refreshExpiresIn,
    );

    return {
      message: 'Login successful',
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  generateToken(user: any) {
    const payload = {
      sub: user.id || user.sub,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
    });
  }

  // PROFILE
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // REFRESH TOKEN
  async refresh(refreshToken: string) {
    try {
      // Decode refresh token to get user info
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.sub;

      // Verify refresh token exists in Redis
      const tokenKey = `refresh_token:${userId}:${refreshToken}`;
      const tokenExists = await this.redisService.exists(tokenKey);

      if (!tokenExists) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      // Generate new access token
      const access_token = this.jwtService.sign(newPayload, {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
      });

      return {
        access_token,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // LOGOUT
  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.sub;
      const tokenKey = `refresh_token:${userId}:${refreshToken}`;
      await this.redisService.del(tokenKey);

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      // Even if token is invalid, consider logout successful
      return {
        message: 'Logout successful',
      };
    }
  }
}