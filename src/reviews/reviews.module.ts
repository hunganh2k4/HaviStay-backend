import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService, SupabaseService]
})
export class ReviewsModule { }
