import { Module } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { WishlistsController } from './wishlists.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WishlistsController],
  providers: [WishlistsService, PrismaService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
