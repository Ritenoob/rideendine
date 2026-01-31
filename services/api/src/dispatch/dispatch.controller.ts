import { Controller, Post, Get, Body, UseGuards, Query, Req } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user.interface';
import {
  AssignDriverDto,
  DriverAssignmentResponseDto,
  AvailableDriverDto,
  AcceptAssignmentDto,
  DeclineAssignmentDto,
} from './dto/dispatch.dto';
import { DriversService } from '../drivers/drivers.service';

@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly dispatchService: DispatchService,
    private readonly driversService: DriversService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CHEF)
  @Post('assign')
  async assignDriver(@Body() dto: AssignDriverDto): Promise<DriverAssignmentResponseDto> {
    return this.dispatchService.assignDriverToOrder(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('available-drivers')
  async getAvailableDrivers(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm?: string,
  ): Promise<AvailableDriverDto[]> {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = radiusKm ? parseFloat(radiusKm) : 10;

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid latitude or longitude');
    }

    return this.dispatchService.findAvailableDriversNear(lat, lon, radius);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Post('accept')
  async acceptAssignment(
    @Req() req: any,
    @Body() dto: AcceptAssignmentDto,
  ): Promise<{ success: boolean }> {
    const driver = await this.driversService.getDriverProfile(req.user.id);
    return this.dispatchService.acceptAssignment(driver.id, dto.assignmentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @Post('decline')
  async declineAssignment(
    @Req() req: any,
    @Body() dto: DeclineAssignmentDto,
  ): Promise<{ success: boolean }> {
    const driver = await this.driversService.getDriverProfile(req.user.id);
    return this.dispatchService.declineAssignment(driver.id, dto.assignmentId, dto.reason);
  }
}
