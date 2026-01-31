import { Controller, Get, Post, Patch, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
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
  AcceptOrderDto,
  MarkPickedUpDto,
  MarkDeliveredDto,
  AvailableOrderDto,
  ActiveDeliveryDto,
  DeliveryHistoryDto,
  EarningsResponseDto,
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

  // New mobile app endpoints

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Patch('me/status')
  async updateStatus(
    @Req() req: any,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<{ isAvailable: boolean }> {
    return this.driversService.updateAvailability(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('available-orders')
  async getAvailableOrders(@Req() req: any): Promise<AvailableOrderDto[]> {
    return this.driversService.getAvailableOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Post('orders/:orderId/accept')
  async acceptOrder(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() dto: AcceptOrderDto,
  ): Promise<{ success: boolean; orderId: string }> {
    return this.driversService.acceptOrder(req.user.id, orderId, dto.estimatedPickupMinutes);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('me/active-delivery')
  async getActiveDelivery(@Req() req: any): Promise<ActiveDeliveryDto | null> {
    return this.driversService.getActiveDelivery(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Patch('orders/:orderId/picked-up')
  async markPickedUp(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() dto: MarkPickedUpDto,
  ): Promise<{ success: boolean; orderId: string }> {
    return this.driversService.markPickedUp(req.user.id, orderId, dto.estimatedDeliveryMinutes);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Patch('orders/:orderId/delivered')
  async markDelivered(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() dto: MarkDeliveredDto,
  ): Promise<{ success: boolean; orderId: string }> {
    return this.driversService.markDelivered(
      req.user.id,
      orderId,
      dto.deliveryPhotoUrl,
      dto.notes,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('me/earnings')
  async getEarnings(
    @Req() req: any,
    @Query('period') period?: string,
  ): Promise<EarningsResponseDto> {
    return this.driversService.getEarnings(req.user.id, period || 'all');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('me/history')
  async getHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<DeliveryHistoryDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.driversService.getDeliveryHistory(req.user.id, limitNum);
  }
}
