import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './room.service';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [PropertiesController, RoomsController],
  providers: [
    PropertiesService,
    JwtStrategy,
    RolesGuard,
    RoomsService
  ],
  exports: [PropertiesService, RoomsService],
})
export class PropertiesModule { }