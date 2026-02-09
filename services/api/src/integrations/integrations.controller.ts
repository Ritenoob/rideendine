import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { CoocoWebhookDto, MealbridgeDispatchDto } from './dto/integrations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('cooco/orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cooco webhook: Receive order from Cooco platform',
    description: 'Webhook endpoint for Cooco to send new orders. Signature verified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order received successfully',
    schema: {
      example: {
        success: true,
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Order received and queued for delivery',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid signature or malformed payload' })
  async receiveCoocoOrder(@Body() webhookData: CoocoWebhookDto) {
    return this.integrationsService.processCoocoOrder(webhookData);
  }

  @Post('mealbridge/dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'chef')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Dispatch order to Mealbridge for delivery',
    description: 'Internal endpoint to trigger Mealbridge dispatch (called after payment)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dispatch created successfully',
    schema: {
      example: {
        success: true,
        dispatchId: 'mb-550e8400-e29b-41d4',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async dispatchOrder(@Body() body: { orderId: string }) {
    return this.integrationsService.dispatchToMealbridge(body.orderId);
  }

  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get integration events (admin only)',
    description: 'Returns Cooco and Mealbridge integration logs for debugging',
  })
  @ApiResponse({
    status: 200,
    description: 'Integration events',
    schema: {
      example: {
        events: [
          {
            id: '1',
            source: 'cooco',
            eventType: 'order_received',
            orderId: '550e8400-e29b-41d4-a716-446655440000',
            payload: {},
            status: 'success',
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getIntegrationEvents(
    @Query('source') source?: 'cooco' | 'mealbridge',
    @Query('status') status?: 'success' | 'failed',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.integrationsService.getIntegrationEvents({
      source,
      status,
      limit: limit ? parseInt(String(limit)) : 50,
      offset: offset ? parseInt(String(offset)) : 0,
    });
  }
}
