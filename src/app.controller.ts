import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) { }

  @Get('test-db')
  async testDb() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      message: 'Prisma + Supabase connected successfully',
    };
  }
}