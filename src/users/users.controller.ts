import { Controller, Patch, UseGuards, Req, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('cccdImage', {
    storage: memoryStorage(),
  }))
  async becomeHost(
    @Req() req: any,
    @Body() dto: BecomeHostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.cccdImage = await this.supabaseService.uploadCccdFile(file);
    }
    return this.usersService.becomeHost(req.user.userId, dto);
  }
}
