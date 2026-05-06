import { Module } from '@nestjs/common';
import { PropertyServicesService } from './property-services.service';
import { PropertyServicesController } from './property-services.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [PropertyServicesController],
  providers: [PropertyServicesService],
  exports: [PropertyServicesService],
})
export class PropertyServicesModule {}
