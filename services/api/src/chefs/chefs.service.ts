import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ApplyAsChefDto, UpdateChefDto, SearchChefsDto } from './dto/chef.dto';
import { StripeService } from '../stripe/stripe.service';
import { StripeOnboardResponseDto, StripeAccountStatusDto } from '../stripe/dto/stripe.dto';

@Injectable()
export class ChefsService {
  constructor(
    @Inject('DATABASE_POOL') private db: Pool,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  async applyAsChef(userId: string, applyDto: ApplyAsChefDto) {
    // Check if user already has a chef profile
    const existing = await this.db.query('SELECT id FROM chefs WHERE user_id = $1', [userId]);

    if (existing.rows.length > 0) {
      throw new BadRequestException('User already has a chef profile');
    }

    // Check user role
    const userCheck = await this.db.query('SELECT role FROM users WHERE id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    if (userCheck.rows[0].role !== 'chef') {
      throw new BadRequestException('User role must be "chef" to apply');
    }

    const {
      businessName,
      description,
      address,
      latitude,
      longitude,
      cuisineTypes,
      minimumOrderCents,
      deliveryRadiusKm,
      operatingHours,
    } = applyDto;

    const result = await this.db.query(
      `INSERT INTO chefs (
        user_id, business_name, description, address, 
        latitude, longitude, cuisine_types,
        minimum_order_cents, delivery_radius_km, operating_hours,
        verification_status, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, business_name, verification_status, created_at`,
      [
        userId,
        businessName,
        description,
        address,
        latitude,
        longitude,
        cuisineTypes,
        minimumOrderCents || 1000, // Default $10 minimum
        deliveryRadiusKm || 10, // Default 10km radius
        JSON.stringify(operatingHours || {}),
        'pending',
        false, // Not active until verified
      ],
    );

    return {
      message: 'Chef application submitted. Pending verification.',
      chef: result.rows[0],
    };
  }

  async getChefById(chefId: string) {
    const result = await this.db.query(
      `SELECT 
        c.*,
        u.email,
        p.first_name,
        p.last_name,
        p.phone,
        (SELECT COUNT(*) FROM orders WHERE chef_id = c.id AND status = 'delivered') as total_orders,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = c.user_id AND reviewee_type = 'chef') as review_count
      FROM chefs c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE c.id = $1`,
      [chefId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Chef not found');
    }

    const chef = result.rows[0];

    // Get menus
    const menusResult = await this.db.query(
      `SELECT m.*, 
        (SELECT COUNT(*) FROM menu_items WHERE menu_id = m.id AND is_available = true) as item_count
      FROM menus m
      WHERE m.chef_id = $1 AND m.is_active = true
      ORDER BY m.created_at DESC`,
      [chefId],
    );

    return {
      ...chef,
      operating_hours: JSON.parse(chef.operating_hours || '{}'),
      menus: menusResult.rows,
    };
  }

  async updateChef(userId: string, chefId: string, updateDto: UpdateChefDto) {
    // Verify ownership
    const ownerCheck = await this.db.query('SELECT id FROM chefs WHERE id = $1 AND user_id = $2', [
      chefId,
      userId,
    ]);

    if (ownerCheck.rows.length === 0) {
      throw new ForbiddenException('You do not own this chef profile');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateDto.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(updateDto.description);
    }

    if (updateDto.address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(updateDto.address);
    }

    if (updateDto.latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(updateDto.latitude);
    }

    if (updateDto.longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(updateDto.longitude);
    }

    if (updateDto.cuisineTypes !== undefined) {
      updates.push(`cuisine_types = $${paramCount++}`);
      values.push(updateDto.cuisineTypes);
    }

    if (updateDto.minimumOrderCents !== undefined) {
      updates.push(`minimum_order_cents = $${paramCount++}`);
      values.push(updateDto.minimumOrderCents);
    }

    if (updateDto.deliveryRadiusKm !== undefined) {
      updates.push(`delivery_radius_km = $${paramCount++}`);
      values.push(updateDto.deliveryRadiusKm);
    }

    if (updateDto.operatingHours !== undefined) {
      updates.push(`operating_hours = $${paramCount++}`);
      values.push(JSON.stringify(updateDto.operatingHours));
    }

    if (updateDto.isAcceptingOrders !== undefined) {
      updates.push(`is_accepting_orders = $${paramCount++}`);
      values.push(updateDto.isAcceptingOrders);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(chefId);

    const query = `UPDATE chefs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await this.db.query(query, values);

    return {
      ...result.rows[0],
      operating_hours: JSON.parse(result.rows[0].operating_hours || '{}'),
    };
  }

  async searchChefs(searchDto: SearchChefsDto) {
    const {
      cuisineType,
      latitude,
      longitude,
      radiusKm = 10,
      minRating = 0,
      sortBy = 'rating',
      page = 1,
      perPage = 20,
    } = searchDto;

    const conditions: string[] = ['c.verification_status = $1', 'c.is_active = $2'];
    const values: any[] = ['approved', true];
    let paramCount = 3;

    // Cuisine type filter
    if (cuisineType) {
      conditions.push(`$${paramCount} = ANY(c.cuisine_types)`);
      values.push(cuisineType);
      paramCount++;
    }

    // Rating filter
    if (minRating > 0) {
      conditions.push(`c.rating >= $${paramCount}`);
      values.push(minRating);
      paramCount++;
    }

    // Distance filter (if location provided)
    let distanceCalc = '0';
    if (latitude !== undefined && longitude !== undefined) {
      // Haversine formula for distance
      distanceCalc = `
        6371 * acos(
          cos(radians($${paramCount})) * cos(radians(c.latitude)) *
          cos(radians(c.longitude) - radians($${paramCount + 1})) +
          sin(radians($${paramCount})) * sin(radians(c.latitude))
        )
      `;
      values.push(latitude, longitude);
      paramCount += 2;

      conditions.push(`${distanceCalc} <= $${paramCount}`);
      values.push(radiusKm);
      paramCount++;
    }

    // Sorting
    let orderClause = 'c.rating DESC';
    if (sortBy === 'distance' && latitude !== undefined) {
      orderClause = `${distanceCalc} ASC`;
    } else if (sortBy === 'total_orders') {
      orderClause = 'c.total_orders DESC';
    }

    // Pagination
    const offset = (page - 1) * perPage;
    values.push(perPage, offset);

    const query = `
      SELECT 
        c.id,
        c.business_name,
        c.description,
        c.address,
        c.latitude,
        c.longitude,
        c.cuisine_types,
        c.rating,
        c.total_orders,
        c.minimum_order_cents,
        c.delivery_radius_km,
        c.is_accepting_orders,
        ${latitude !== undefined ? `${distanceCalc} as distance_km,` : ''}
        (SELECT COUNT(*) FROM menus WHERE chef_id = c.id AND is_active = true) as menu_count
      FROM chefs c
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await this.db.query(query, values);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chefs c
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await this.db.query(countQuery, values.slice(0, paramCount - 2));

    return {
      chefs: result.rows,
      pagination: {
        page,
        perPage,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / perPage),
      },
    };
  }

  async uploadDocument(userId: string, chefId: string, documentType: string, fileUrl: string) {
    // Verify ownership
    const ownerCheck = await this.db.query('SELECT id FROM chefs WHERE id = $1 AND user_id = $2', [
      chefId,
      userId,
    ]);

    if (ownerCheck.rows.length === 0) {
      throw new ForbiddenException('You do not own this chef profile');
    }

    const result = await this.db.query(
      `INSERT INTO chef_documents (chef_id, document_type, file_url, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, document_type, status, uploaded_at`,
      [chefId, documentType, fileUrl, 'pending'],
    );

    return result.rows[0];
  }

  async toggleVacationMode(userId: string, chefId: string) {
    const result = await this.db.query(
      `UPDATE chefs 
       SET is_accepting_orders = NOT is_accepting_orders
       WHERE id = $1 AND user_id = $2
       RETURNING is_accepting_orders`,
      [chefId, userId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('You do not own this chef profile');
    }

    return {
      isAcceptingOrders: result.rows[0].is_accepting_orders,
      message: result.rows[0].is_accepting_orders
        ? 'Now accepting orders'
        : 'Vacation mode enabled',
    };
  }

  async initiateStripeOnboarding(
    userId: string,
    chefId: string,
    refreshUrl?: string,
    returnUrl?: string,
  ): Promise<StripeOnboardResponseDto> {
    // Verify ownership
    const chefResult = await this.db.query(
      `SELECT c.id, c.stripe_account_id, u.email
       FROM chefs c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [chefId, userId],
    );

    if (chefResult.rows.length === 0) {
      throw new ForbiddenException('You do not own this chef profile');
    }

    const chef = chefResult.rows[0];
    let stripeAccountId = chef.stripe_account_id;

    // Create Stripe account if it doesn't exist
    if (!stripeAccountId) {
      stripeAccountId = await this.stripeService.createConnectAccount(chef.email);

      // Save account ID to database
      await this.db.query('UPDATE chefs SET stripe_account_id = $1 WHERE id = $2', [
        stripeAccountId,
        chefId,
      ]);
    }

    // Generate account link
    const finalRefreshUrl =
      refreshUrl ||
      this.configService.get<string>('STRIPE_CONNECT_REFRESH_URL') ||
      `${this.configService.get<string>('CHEF_DASHBOARD_URL')}/stripe/refresh`;

    const finalReturnUrl =
      returnUrl ||
      this.configService.get<string>('STRIPE_CONNECT_RETURN_URL') ||
      `${this.configService.get<string>('CHEF_DASHBOARD_URL')}/stripe/complete`;

    const accountLink = await this.stripeService.createAccountLink(
      stripeAccountId,
      finalRefreshUrl,
      finalReturnUrl,
    );

    return {
      url: accountLink.url,
      accountId: stripeAccountId,
      expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
    };
  }

  async getStripeAccountStatus(userId: string, chefId: string): Promise<StripeAccountStatusDto> {
    // Verify ownership
    const chefResult = await this.db.query(
      'SELECT stripe_account_id FROM chefs WHERE id = $1 AND user_id = $2',
      [chefId, userId],
    );

    if (chefResult.rows.length === 0) {
      throw new ForbiddenException('You do not own this chef profile');
    }

    const stripeAccountId = chefResult.rows[0].stripe_account_id;

    if (!stripeAccountId) {
      throw new BadRequestException(
        'Stripe account not yet created. Please initiate onboarding first.',
      );
    }

    // Get status from Stripe
    const status = await this.stripeService.getAccountStatus(stripeAccountId);

    // Update database if onboarding is complete
    if (status.onboardingComplete) {
      await this.db.query('UPDATE chefs SET stripe_onboarding_complete = true WHERE id = $1', [
        chefId,
      ]);
    }

    return status;
  }

  async handleStripeAccountUpdate(stripeAccountId: string): Promise<void> {
    // Find chef by Stripe account ID
    const chefResult = await this.db.query('SELECT id FROM chefs WHERE stripe_account_id = $1', [
      stripeAccountId,
    ]);

    if (chefResult.rows.length === 0) {
      throw new NotFoundException(`Chef with Stripe account ${stripeAccountId} not found`);
    }

    const chefId = chefResult.rows[0].id;

    // Get current account status
    const status = await this.stripeService.getAccountStatus(stripeAccountId);

    // Update database
    await this.db.query(
      `UPDATE chefs 
       SET stripe_onboarding_complete = $1
       WHERE id = $2`,
      [status.onboardingComplete, chefId],
    );

    // If just completed and verification is pending, update to under_review
    if (status.onboardingComplete) {
      await this.db.query(
        `UPDATE chefs 
         SET verification_status = 'under_review'
         WHERE id = $1 AND verification_status = 'pending'`,
        [chefId],
      );
    }
  }

  async handleStripeAccountDeauthorized(stripeAccountId: string): Promise<void> {
    // Find chef and disconnect account
    const result = await this.db.query(
      `UPDATE chefs 
       SET stripe_account_id = NULL,
           stripe_onboarding_complete = false,
           is_active = false
       WHERE stripe_account_id = $1
       RETURNING id`,
      [stripeAccountId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Chef with Stripe account ${stripeAccountId} not found`);
    }

    // TODO: Send notification to chef about disconnection
  }
}
