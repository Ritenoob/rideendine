import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  RejectOrderDto,
  RefundOrderDto,
  CancelOrderDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, UserRole } from '../common/interfaces/user.interface';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create a new order',
    description: 'Customer creates a new food order from a chef menu',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        chefId: '789e4567-e89b-12d3-a456-426614174000',
        status: 'pending',
        totalAmount: 2550,
        deliveryFee: 500,
        commission: 383,
        items: [
          {
            menuItemId: 'abc123',
            name: 'Chicken Biryani',
            quantity: 2,
            price: 1000,
          },
        ],
        createdAt: '2026-01-31T12:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Not a customer' })
  async createOrder(@CurrentUser() user: JwtPayload, @Body() createDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.sub, createDto);
  }

  @Get('eta')
  @ApiOperation({
    summary: 'Get order estimated time of arrival',
    description: 'Calculate ETA for order delivery based on current status and driver location',
  })
  @ApiQuery({ name: 'orderId', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'ETA calculated successfully',
    schema: {
      example: {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        eta: '2026-01-31T12:45:00.000Z',
        estimatedMinutes: 25,
        status: 'in_transit',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  async getOrderEta(
    @CurrentUser() user: JwtPayload,
    @Query('orderId', new ParseUUIDPipe()) orderId: string,
  ) {
    return this.ordersService.getOrderEta(orderId, user.sub, user.role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieve detailed information about a specific order',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Not authorized to view this order' })
  async getOrder(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, user.sub, user.role);
  }

  @Get()
  @ApiOperation({
    summary: 'List orders',
    description: 'Get a list of orders with optional filtering by status, customer, chef, or driver',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'] })
  @ApiQuery({ name: 'customerId', required: false, type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'chefId', required: false, type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'driverId', required: false, type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: 'number', example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Orders list retrieved',
    schema: {
      example: {
        orders: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'delivered',
            totalAmount: 2550,
            createdAt: '2026-01-31T12:00:00.000Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
    },
  })
  async listOrders(@CurrentUser() user: JwtPayload, @Query() query: OrderQueryDto) {
    return this.ordersService.listOrders(query, user.sub, user.role);
  }

  @Post(':id/create-payment-intent')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create Stripe payment intent',
    description: 'Initialize Stripe payment for an order',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Payment intent created',
    schema: {
      example: {
        clientSecret: 'pi_1234567890_secret_abcdef',
        paymentIntentId: 'pi_1234567890',
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Not authorized or order already paid' })
  async createPaymentIntent(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.createPaymentIntent(id, user.sub);
  }

  @Patch(':id/accept')
  @Roles(UserRole.CHEF)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Chef accepts order',
    description: 'Chef confirms they will prepare the order',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order accepted by chef' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async acceptOrder(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.acceptOrder(id, user.sub);
  }

  @Patch(':id/reject')
  @Roles(UserRole.CHEF)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Chef rejects order',
    description: 'Chef declines to prepare the order with a reason',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order rejected by chef' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async rejectOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() rejectDto: RejectOrderDto,
  ) {
    return this.ordersService.rejectOrder(id, user.sub, rejectDto);
  }

  @Patch(':id/ready')
  @Roles(UserRole.CHEF)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Mark order as ready for pickup',
    description: 'Chef marks order as ready for driver pickup',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order marked as ready' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async markReady(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.markOrderReady(id, user.sub);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel an order with a reason. Allowed for customers (before accepted) and admins (anytime)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, user.sub, cancelDto.cancellationReason);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN, UserRole.CHEF)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Refund order',
    description: 'Process a full or partial refund for an order',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiForbiddenResponse({ description: 'Not authorized' })
  async refundOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() refundDto: RefundOrderDto,
  ) {
    return this.ordersService.refundOrder(id, user.sub, refundDto);
  }

  @Patch(':id/pickup')
  @Roles(UserRole.DRIVER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Mark order as picked up',
    description: 'Driver confirms they have picked up the order from chef',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order marked as picked up' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async markPickedUp(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.markOrderPickedUp(id, user.sub);
  }

  @Patch(':id/in-transit')
  @Roles(UserRole.DRIVER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Mark order as in transit',
    description: 'Driver confirms they are en route to customer',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order marked as in transit' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async markInTransit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.markOrderInTransit(id, user.sub);
  }

  @Patch(':id/deliver')
  @Roles(UserRole.DRIVER)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Mark order as delivered',
    description: 'Driver confirms order has been delivered to customer',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  @ApiForbiddenResponse({ description: 'Not authorized or invalid state transition' })
  async markDelivered(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.markOrderDelivered(id, user.sub);
  }

  @Get(':id/tracking')
  @ApiOperation({
    summary: 'Get order tracking information',
    description: 'Get real-time tracking information including driver location and ETA',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Tracking information retrieved',
    schema: {
      example: {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'in_transit',
        driverLocation: {
          lat: 40.7128,
          lng: -74.0060,
        },
        eta: '2026-01-31T12:45:00.000Z',
        estimatedMinutes: 15,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  async getOrderTracking(@Param('id') id: string) {
    return this.ordersService.getOrderTracking(id);
  }
}
