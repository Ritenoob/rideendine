import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '../common/interfaces/user.interface';
import {
  UsersQueryDto,
  ChefsQueryDto,
  DriversQueryDto,
  OrdersQueryDto,
  ReviewsQueryDto,
  CommissionQueryDto,
  PayoutsQueryDto,
  UpdateUserDto,
  UpdateSettingsDto,
  RejectChefDto,
  RejectDriverDto,
  RefundOrderDto,
  RemoveReviewDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================================
  // DASHBOARD ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/dashboard/stats
   * Returns dashboard statistics for the admin panel
   */
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * GET /admin/dashboard/activity
   * Returns recent activity feed for the dashboard
   */
  @Get('dashboard/activity')
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  // ============================================================================
  // USER MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/users
   * List all users with pagination and optional role/search filters
   */
  @Get('users')
  async listUsers(@Query() query: UsersQueryDto) {
    return this.adminService.listUsers({
      role: query.role,
      search: query.search,
      page: query.page,
      perPage: query.perPage,
    });
  }

  /**
   * PATCH /admin/users/:id
   * Update user information
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() data: UpdateUserDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.updateUser(userId, data, admin.sub);
  }

  /**
   * GET /admin/users/:id
   * Get detailed user information
   */
  @Get('users/:id')
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  /**
   * POST /admin/users/:id/suspend
   * Suspend a user account
   */
  @Post('users/:id/suspend')
  async suspendUser(@Param('id') userId: string, @CurrentUser() admin: JwtPayload) {
    return this.adminService.suspendUser(userId, admin.sub);
  }

  /**
   * POST /admin/users/:id/activate
   * Activate a suspended user account
   */
  @Post('users/:id/activate')
  async activateUser(@Param('id') userId: string, @CurrentUser() admin: JwtPayload) {
    return this.adminService.activateUser(userId, admin.sub);
  }

  // ============================================================================
  // CHEF MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/chefs
   * List all chefs with optional status/search filters
   */
  @Get('chefs')
  async listChefs(@Query() query: ChefsQueryDto) {
    return this.adminService.listChefs(query.status, query.search);
  }

  /**
   * GET /admin/chefs/:id
   * Get detailed chef information
   */
  @Get('chefs/:id')
  async getChefDetails(@Param('id') chefId: string) {
    return this.adminService.getChefDetails(chefId);
  }

  /**
   * PATCH /admin/chefs/:id/approve
   * Approve a chef application
   */
  @Patch('chefs/:id/approve')
  async approveChef(@Param('id') chefId: string, @CurrentUser() admin: JwtPayload) {
    return this.adminService.updateChefStatus(chefId, 'approved', undefined, admin.sub);
  }

  /**
   * PATCH /admin/chefs/:id/reject
   * Reject a chef application with optional reason
   */
  @Patch('chefs/:id/reject')
  async rejectChef(
    @Param('id') chefId: string,
    @Body() body: RejectChefDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.updateChefStatus(chefId, 'rejected', body.reason, admin.sub);
  }

  // ============================================================================
  // DRIVER MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/drivers
   * List all drivers with optional status/search filters
   */
  @Get('drivers')
  async listDrivers(@Query() query: DriversQueryDto) {
    return this.adminService.listDrivers(query.status, query.search);
  }

  /**
   * PATCH /admin/drivers/:id/approve
   * Approve a driver application
   */
  @Patch('drivers/:id/approve')
  async approveDriver(@Param('id') driverId: string, @CurrentUser() admin: JwtPayload) {
    return this.adminService.approveDriver(driverId, admin.sub);
  }

  /**
   * PATCH /admin/drivers/:id/reject
   * Reject a driver application with reason
   */
  @Patch('drivers/:id/reject')
  async rejectDriver(
    @Param('id') driverId: string,
    @Body() body: RejectDriverDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.rejectDriver(driverId, body.reason, admin.sub);
  }

  // ============================================================================
  // ORDER MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/orders
   * List all orders with pagination and optional status/search filters
   */
  @Get('orders')
  async listOrders(@Query() query: OrdersQueryDto) {
    return this.adminService.listOrders({
      status: query.status,
      search: query.search,
      page: query.page,
      perPage: query.perPage,
    });
  }

  /**
   * GET /admin/orders/:id
   * Get detailed order information including items, payment, and status history
   */
  @Get('orders/:id')
  async getOrderDetails(@Param('id') orderId: string) {
    return this.adminService.getOrderDetails(orderId);
  }

  /**
   * POST /admin/orders/:id/refund
   * Process a refund for an order
   */
  @Post('orders/:id/refund')
  async refundOrder(
    @Param('id') orderId: string,
    @Body() body: RefundOrderDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.refundOrder(orderId, body.reason, admin.sub);
  }

  // ============================================================================
  // COMMISSION & ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/commission
   * Get commission statistics for a given time period
   */
  @Get('commission')
  async getCommissionStats(@Query() query: CommissionQueryDto) {
    return this.adminService.getCommissionStats(query.period);
  }

  /**
   * GET /admin/payouts
   * List all payouts with optional status filter
   */
  @Get('payouts')
  async getPayouts(@Query() query: PayoutsQueryDto) {
    return this.adminService.getPayouts(query.status);
  }

  // ============================================================================
  // REVIEW MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/reviews
   * List all reviews with optional type and flagged filters
   */
  @Get('reviews')
  async listReviews(@Query() query: ReviewsQueryDto) {
    return this.adminService.listReviews(query.revieweeType, query.flagged === 'true');
  }

  /**
   * DELETE /admin/reviews/:id
   * Remove a review with reason for moderation
   */
  @Delete('reviews/:id')
  async removeReview(
    @Param('id') reviewId: string,
    @Body() body: RemoveReviewDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.removeReview(reviewId, body.reason, admin.sub);
  }

  /**
   * POST /admin/reviews/:id/flag
   * Flag a review for moderation
   */
  @Post('reviews/:id/flag')
  async flagReview(@Param('id') reviewId: string, @CurrentUser() admin: JwtPayload) {
    return this.adminService.flagReview(reviewId, admin.sub);
  }

  /**
   * POST /admin/reviews/:id/unflag
   * Unflag a review
   */
  @Post('reviews/:id/unflag')
  async unflagReview(@Param('id') reviewId: string, @CurrentUser() admin: JwtPayload) {
    return this.adminService.unflagReview(reviewId, admin.sub);
  }

  // ============================================================================
  // SETTINGS ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/settings
   * Get platform settings
   */
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  /**
   * PATCH /admin/settings
   * Update platform settings
   */
  @Patch('settings')
  async updateSettings(@Body() data: UpdateSettingsDto, @CurrentUser() admin: JwtPayload) {
    return this.adminService.updateSettings(data, admin.sub);
  }
}
