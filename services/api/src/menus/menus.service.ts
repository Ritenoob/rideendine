import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CreateMenuDto, UpdateMenuDto, CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu.dto';

@Injectable()
export class MenusService {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  async createMenu(userId: string, chefId: string, createDto: CreateMenuDto) {
    // Verify ownership
    const ownerCheck = await this.db.query('SELECT id FROM chefs WHERE id = $1 AND user_id = $2', [
      chefId,
      userId,
    ]);

    if (ownerCheck.rows.length === 0) {
      throw new ForbiddenException('You do not own this chef profile');
    }

    const { name, description, availableDays, availableFrom, availableUntil } = createDto;

    const result = await this.db.query(
      `INSERT INTO menus (chef_id, name, description, available_days, available_from, available_until)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [chefId, name, description, availableDays, availableFrom, availableUntil],
    );

    return result.rows[0];
  }

  async getMenuById(menuId: string) {
    const menuResult = await this.db.query(
      `SELECT m.*, c.business_name as chef_name, c.id as chef_id
       FROM menus m
       JOIN chefs c ON m.chef_id = c.id
       WHERE m.id = $1`,
      [menuId],
    );

    if (menuResult.rows.length === 0) {
      throw new NotFoundException('Menu not found');
    }

    const menu = menuResult.rows[0];

    // Get menu items
    const itemsResult = await this.db.query(
      `SELECT * FROM menu_items
       WHERE menu_id = $1 AND is_available = true
       ORDER BY category, name`,
      [menuId],
    );

    return {
      ...menu,
      items: itemsResult.rows,
    };
  }

  async updateMenu(userId: string, menuId: string, updateDto: UpdateMenuDto) {
    // Verify ownership
    const ownerCheck = await this.db.query(
      `SELECT m.id FROM menus m
       JOIN chefs c ON m.chef_id = c.id
       WHERE m.id = $1 AND c.user_id = $2`,
      [menuId, userId],
    );

    if (ownerCheck.rows.length === 0) {
      throw new ForbiddenException('You do not own this menu');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateDto.name);
    }

    if (updateDto.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(updateDto.description);
    }

    if (updateDto.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(updateDto.isActive);
    }

    if (updateDto.availableDays !== undefined) {
      updates.push(`available_days = $${paramCount++}`);
      values.push(updateDto.availableDays);
    }

    if (updateDto.availableFrom !== undefined) {
      updates.push(`available_from = $${paramCount++}`);
      values.push(updateDto.availableFrom);
    }

    if (updateDto.availableUntil !== undefined) {
      updates.push(`available_until = $${paramCount++}`);
      values.push(updateDto.availableUntil);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(menuId);

    const query = `UPDATE menus SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.db.query(query, values);

    return result.rows[0];
  }

  async deleteMenu(userId: string, menuId: string) {
    const result = await this.db.query(
      `UPDATE menus m
       SET is_active = false
       FROM chefs c
       WHERE m.id = $1 AND m.chef_id = c.id AND c.user_id = $2
       RETURNING m.id`,
      [menuId, userId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('You do not own this menu or menu not found');
    }

    return { message: 'Menu deleted successfully' };
  }

  async createMenuItem(userId: string, menuId: string, createDto: CreateMenuItemDto) {
    // Verify ownership
    const ownerCheck = await this.db.query(
      `SELECT m.id FROM menus m
       JOIN chefs c ON m.chef_id = c.id
       WHERE m.id = $1 AND c.user_id = $2`,
      [menuId, userId],
    );

    if (ownerCheck.rows.length === 0) {
      throw new ForbiddenException('You do not own this menu');
    }

    const { name, description, priceCents, imageUrl, category, dietaryTags, prepTimeMinutes } =
      createDto;

    const result = await this.db.query(
      `INSERT INTO menu_items (
        menu_id, name, description, price_cents, image_url, category, dietary_tags, prep_time_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [menuId, name, description, priceCents, imageUrl, category, dietaryTags, prepTimeMinutes],
    );

    return result.rows[0];
  }

  async updateMenuItem(userId: string, itemId: string, updateDto: UpdateMenuItemDto) {
    // Verify ownership
    const ownerCheck = await this.db.query(
      `SELECT mi.id FROM menu_items mi
       JOIN menus m ON mi.menu_id = m.id
       JOIN chefs c ON m.chef_id = c.id
       WHERE mi.id = $1 AND c.user_id = $2`,
      [itemId, userId],
    );

    if (ownerCheck.rows.length === 0) {
      throw new ForbiddenException('You do not own this menu item');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateDto.name);
    }

    if (updateDto.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(updateDto.description);
    }

    if (updateDto.priceCents !== undefined) {
      updates.push(`price_cents = $${paramCount++}`);
      values.push(updateDto.priceCents);
    }

    if (updateDto.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(updateDto.imageUrl);
    }

    if (updateDto.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(updateDto.category);
    }

    if (updateDto.dietaryTags !== undefined) {
      updates.push(`dietary_tags = $${paramCount++}`);
      values.push(updateDto.dietaryTags);
    }

    if (updateDto.isAvailable !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(updateDto.isAvailable);
    }

    if (updateDto.prepTimeMinutes !== undefined) {
      updates.push(`prep_time_minutes = $${paramCount++}`);
      values.push(updateDto.prepTimeMinutes);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(itemId);

    const query = `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.db.query(query, values);

    return result.rows[0];
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const result = await this.db.query(
      `UPDATE menu_items mi
       SET is_available = false
       FROM menus m
       JOIN chefs c ON m.chef_id = c.id
       WHERE mi.id = $1 AND mi.menu_id = m.id AND c.user_id = $2
       RETURNING mi.id`,
      [itemId, userId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('You do not own this menu item or item not found');
    }

    return { message: 'Menu item deleted successfully' };
  }
}
