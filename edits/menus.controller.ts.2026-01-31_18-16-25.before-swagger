import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto, CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, UserRole } from '../common/interfaces/user.interface';

@Controller()
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post('chefs/:chefId/menus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async createMenu(
    @CurrentUser() user: JwtPayload,
    @Param('chefId') chefId: string,
    @Body() createDto: CreateMenuDto,
  ) {
    return this.menusService.createMenu(user.sub, chefId, createDto);
  }

  @Get('menus/:id')
  async getMenu(@Param('id') id: string) {
    return this.menusService.getMenuById(id);
  }

  @Patch('menus/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async updateMenu(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuDto,
  ) {
    return this.menusService.updateMenu(user.sub, id, updateDto);
  }

  @Delete('menus/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMenu(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.menusService.deleteMenu(user.sub, id);
  }

  @Post('menus/:menuId/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async createMenuItem(
    @CurrentUser() user: JwtPayload,
    @Param('menuId') menuId: string,
    @Body() createDto: CreateMenuItemDto,
  ) {
    return this.menusService.createMenuItem(user.sub, menuId, createDto);
  }

  @Patch('menu-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async updateMenuItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuItemDto,
  ) {
    return this.menusService.updateMenuItem(user.sub, id, updateDto);
  }

  @Delete('menu-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMenuItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.menusService.deleteMenuItem(user.sub, id);
  }
}
