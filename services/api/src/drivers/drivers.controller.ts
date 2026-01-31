import { Controller, Get, Post, Patch, Body, UseGuards, Req, Query } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user.interface';
import {
  RegisterDriverDto,
  UpdateDriverProfileDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
  DriverProfileResponseDto,
  DriverStatsResponseDto,
  DriverLocationHistoryDto,
} from './dto/driver.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('register')
  async registerDriver(@Body() dto: RegisterDriverDto): Promise<DriverProfileResponseDto> {
    return this.driversService.registerDriver(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('profile')
  async getProfile(@Req() req: any): Promise<DriverProfileResponseDto> {
    return this.driversService.getDriverProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Patch('profile')
  async updateProfile(
    @Req() req: any,
    @Body() dto: UpdateDriverProfileDto,
  ): Promise<DriverProfileResponseDto> {
    return this.driversService.updateDriverProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Patch('availability')
  async updateAvailability(
    @Req() req: any,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<{ isAvailable: boolean }> {
    return this.driversService.updateAvailability(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Post('location')
  async updateLocation(
    @Req() req: any,
    @Body() dto: UpdateLocationDto,
  ): Promise<{ success: boolean }> {
    return this.driversService.updateLocation(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('stats')
  async getStats(@Req() req: any): Promise<DriverStatsResponseDto> {
    return this.driversService.getDriverStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('location/history')
  async getLocationHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<DriverLocationHistoryDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.driversService.getLocationHistory(req.user.id, limitNum);
  }
}
