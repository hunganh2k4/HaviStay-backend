import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/pending-counts
  @Get('pending-counts')
  getPendingCounts() {
    return this.adminService.getPendingCounts();
  }

  // GET /admin/stats
  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // GET /admin/host-verifications?status=PENDING
  @Get('host-verifications')
  getHostVerifications(@Query('status') status?: string) {
    return this.adminService.getHostVerifications(status);
  }

  // PATCH /admin/host-verifications/:id
  @Patch('host-verifications/:id')
  reviewHostVerification(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('reviewNote') reviewNote?: string,
  ) {
    return this.adminService.reviewHostVerification(id, status, reviewNote);
  }

  // GET /admin/properties?verificationStatus=PENDING
  @Get('properties')
  getProperties(@Query('verificationStatus') verificationStatus?: string) {
    return this.adminService.getProperties(verificationStatus);
  }

  // PATCH /admin/properties/:id/verify
  @Patch('properties/:id/verify')
  verifyProperty(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('reviewNote') reviewNote?: string,
  ) {
    return this.adminService.verifyProperty(id, status, reviewNote);
  }
}
