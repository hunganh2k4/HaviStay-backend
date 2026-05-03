import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const result = await this.authService.login(dto);

    // NestJS response object
    const res = req.res;

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('refresh')
  async refresh(@Req() req: any) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Unauthorized');
    }

    const result = await this.authService.refresh(refreshToken);

    req.res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    return {
      message: result.message,
    };
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        await this.authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    req.res.clearCookie('access_token');
    req.res.clearCookie('refresh_token');

    return {
      message: 'Logout successful',
    };
  }
}