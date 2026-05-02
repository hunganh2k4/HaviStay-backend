import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'path';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucket = this.configService.get<string>('SUPABASE_BUCKET') || '';

    if (!supabaseUrl || !supabaseKey || !this.bucket) {
      this.logger.error('Supabase configuration is missing. File uploads will fail.');
    }

    this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      if (!this.bucket) {
        throw new Error('Supabase bucket is not configured');
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExt = extname(file.originalname);
      const fileName = `property-${uniqueSuffix}${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  async uploadCccdFile(file: Express.Multer.File): Promise<string> {
    try {
      if (!this.bucket) {
        throw new Error('Supabase bucket is not configured');
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExt = extname(file.originalname);
      const fileName = `cccd-${uniqueSuffix}${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload CCCD file: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }
}
