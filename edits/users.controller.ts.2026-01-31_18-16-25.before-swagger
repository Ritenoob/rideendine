import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/users.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }

  // Address management

  @Post('addresses')
  async createAddress(@CurrentUser() user: JwtPayload, @Body() createAddressDto: CreateAddressDto) {
    return this.usersService.createAddress(user.sub, createAddressDto);
  }

  @Get('addresses')
  async getAddresses(@CurrentUser() user: JwtPayload) {
    return this.usersService.getAddresses(user.sub);
  }

  @Patch('addresses/:id')
  async updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.sub, id, updateAddressDto);
  }

  @Delete('addresses/:id')
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id);
  }
}
