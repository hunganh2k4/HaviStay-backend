import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('toggle/:propertyId')
  toggle(@Req() req: any, @Param('propertyId') propertyId: string) {
    return this.wishlistsService.toggleWishlist(req.user.userId, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-wishlist')
  getMyWishlist(@Req() req: any) {
    return this.wishlistsService.getMyWishlist(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:propertyId')
  checkStatus(@Req() req: any, @Param('propertyId') propertyId: string) {
    return this.wishlistsService.checkStatus(req.user.userId, propertyId);
  }
}
