import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly supabaseService: SupabaseService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    const urls = await Promise.all(
      files.map((file) => this.supabaseService.uploadFile(file)),
    );
    return { urls };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':propertyId')
  createReview(
    @Req() req: any,
    @Param('propertyId') propertyId: string,
    @Body() data: { rating: number; comment: string; images?: string[] },
  ) {
    return this.reviewsService.createReview(req.user.userId, propertyId, data);
  }

  @Get('property/:propertyId')
  getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReview(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-review/:propertyId')
  getMyReview(@Req() req: any, @Param('propertyId') propertyId: string) {
    return this.reviewsService.getUserReviewForProperty(req.user.userId, propertyId);
  }
}
