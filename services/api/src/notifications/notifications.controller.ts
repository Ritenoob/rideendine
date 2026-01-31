import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/user.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('token')
  async registerToken(@CurrentUser() user: JwtPayload, @Body() dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(user.sub, dto);
  }

  @Delete('token')
  async unregisterToken(@CurrentUser() user: JwtPayload, @Body() body: { token: string }) {
    return this.notificationsService.unregisterDeviceToken(user.sub, body.token);
  }
}
