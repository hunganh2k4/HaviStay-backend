import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { SupabaseModule } from './supabase/supabase.module';
import { RedisModule } from './redis/redis.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { ChatModule } from './chat/chat.module';
import { PropertyServicesModule } from './property-services/property-services.module';

import { AppController } from './app.controller';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    BookingsModule,
    ReviewsModule,
    PaymentsModule,
    AdminModule,
    SupabaseModule,
    WishlistsModule,
    ChatModule,
    PropertyServicesModule,
  ],
  controllers: [AppController],
})
export class AppModule { }