import { Controller, Patch, UseGuards, Req, Body, UseInterceptors, UploadedFiles, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BecomeHostDto } from './dto/become-host.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Patch('become-host')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cccdFrontImage', maxCount: 1 },
    { name: 'cccdBackImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 },
  ], {
    storage: memoryStorage(),
  }))
  async becomeHost(
    @Req() req: any,
    @Body() dto: BecomeHostDto,
    @UploadedFiles() files: {
      cccdFrontImage?: Express.Multer.File[];
      cccdBackImage?: Express.Multer.File[];
      selfieImage?: Express.Multer.File[];
      businessLicense?: Express.Multer.File[];
    },
  ) {
    if (files?.cccdFrontImage?.[0]) {
      dto.cccdFrontImage = await this.supabaseService.uploadVerificationFile(files.cccdFrontImage[0], 'front');
    }
    if (files?.cccdBackImage?.[0]) {
      dto.cccdBackImage = await this.supabaseService.uploadVerificationFile(files.cccdBackImage[0], 'back');
    }
    if (files?.selfieImage?.[0]) {
      dto.selfieImage = await this.supabaseService.uploadVerificationFile(files.selfieImage[0], 'selfie');
    }
    if (files?.businessLicense?.[0]) {
      dto.businessLicense = await this.supabaseService.uploadVerificationFile(files.businessLicense[0], 'license');
    }

    return this.usersService.becomeHost(req.user.userId, dto);
  }

  @Patch('verify-host/:id')
  @UseGuards(JwtAuthGuard)
  async verifyHost(
    @Req() req: any,
    @Param('id') verificationId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('reviewNote') reviewNote?: string,
  ) {
    // Note: In a real app, you would check if req.user has ADMIN role
    return this.usersService.verifyHost(verificationId, status, reviewNote);
  }
}
