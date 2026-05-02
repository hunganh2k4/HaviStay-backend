import { Controller, Patch, UseGuards, Req, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BecomeHostDto } from './dto/become-host.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('become-host')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cccdImage', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async becomeHost(
    @Req() req: any,
    @Body() dto: BecomeHostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.cccdImage = file.filename;
    }
    return this.usersService.becomeHost(req.user.userId, dto);
  }
}
