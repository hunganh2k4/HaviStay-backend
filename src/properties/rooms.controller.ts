import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RoomsService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
  ) { }

  // CREATE ROOM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // GET ALL ROOMS BY PROPERTY
  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.roomsService.findByProperty(
      propertyId,
    );
  }

  // GET ROOM DETAIL
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  // UPDATE ROOM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Patch(':id')
  update(
    @Param('id') roomId: string,
    @Req() req: any,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(
      roomId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // DELETE ROOM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @Delete(':id')
  delete(
    @Param('id') roomId: string,
    @Req() req: any,
  ) {
    return this.roomsService.delete(
      roomId,
      req.user.userId,
      req.user.role,
    );
  }
}