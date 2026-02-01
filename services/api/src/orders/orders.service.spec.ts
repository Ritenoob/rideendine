import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { StripeService } from '../stripe/stripe.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, OrderStateMachine } from './order-state-machine';
import { CommissionCalculator } from './commission-calculator';
import { CreateOrderDto } from './dto/order.dto';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockDb = {
    query: jest.fn(),
    connect: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    confirmPayment: jest.fn(),
    createRefund: jest.fn(),
  };

  const mockGeocodingService = {
    geocodeAddress: jest.fn(),
    reverseGeocode: jest.fn(),
    calculateDistance: jest.fn(),
    validateDeliveryZone: jest.fn().mockReturnValue({ inZone: true, distance: 2.5 }),
  };

  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: 'DATABASE_POOL',
          useValue: mockDb,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: GeocodingService,
          useValue: mockGeocodingService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    // Reset mocks
    jest.clearAllMocks();
    mockDb.connect.mockResolvedValue(mockClient);
  });

  describe('createOrder', () => {
    const customerId = 'customer-id';
    const createOrderDto: CreateOrderDto = {
      chefId: 'chef-id',
      deliveryAddress: '123 Main St, City, State 12345',
      deliveryLatitude: 40.7128,
      deliveryLongitude: -74.006,
      deliveryInstructions: 'Ring doorbell',
      items: [
        { menuItemId: 'item-1', quantity: 2 },
        { menuItemId: 'item-2', quantity: 1 },
      ],
    };

    const mockChef = {
      id: 'chef-id',
      business_name: 'Test Chef',
      is_active: true,
      verification_status: 'approved',
      minimum_order_cents: 1000,
      stripe_account_id: 'acct_test',
      stripe_onboarding_complete: true,
      latitude: 40.7128,
      longitude: -74.006,
      delivery_radius_miles: 5,
    };

    const mockMenuItems = [
      {
        id: 'item-1',
        name: 'Pizza',
        price_cents: 1500,
        is_available: true,
        prep_time_minutes: 30,
        chef_id: 'chef-id',
        menu_active: true,
      },
      {
        id: 'item-2',
        name: 'Salad',
        price_cents: 800,
        is_available: true,
        prep_time_minutes: 15,
        chef_id: 'chef-id',
        menu_active: true,
      },
    ];

    it('should successfully create an order', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [mockChef] }); // SELECT chef
      mockClient.query.mockResolvedValueOnce({ rows: mockMenuItems }); // SELECT menu items
      mockClient.query.mockResolvedValueOnce({
        rows: [{ order_number: 'ORD-001' }],
      }); // Generate order number
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'order-id',
            order_number: 'ORD-001',
            status: OrderStatus.PENDING,
            total_cents: 4300,
          },
        ],
      }); // INSERT order
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // INSERT order items
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // INSERT ledger entries
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await service.createOrder(customerId, createOrderDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('orderNumber');
      expect(result).toHaveProperty('status', OrderStatus.PENDING);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException if chef not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT chef - not found

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        'Chef not found',
      );
    });

    it('should throw BadRequestException if chef is not active', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockChef, is_active: false }],
      });

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        'Chef is not currently accepting orders',
      );
    });

    it('should throw BadRequestException if chef is not verified', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockChef, verification_status: 'pending' }],
      });

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        'Chef is not verified',
      );
    });

    it('should throw BadRequestException if chef has not completed Stripe onboarding', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockChef, stripe_onboarding_complete: false }],
      });

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        'Chef has not completed payment setup',
      );
    });

    it('should throw BadRequestException if menu items not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [mockChef] });
      mockClient.query.mockResolvedValueOnce({ rows: [mockMenuItems[0]] }); // Only 1 item found

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        'One or more menu items not found',
      );
    });

    it('should throw BadRequestException if menu item is not available', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [mockChef] });
      mockClient.query.mockResolvedValueOnce({
        rows: [mockMenuItems[0], { ...mockMenuItems[1], is_available: false }],
      });

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow(
        'Some menu items are not available',
      );
    });

    it('should calculate correct subtotal from menu items', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [mockChef] });
      mockClient.query.mockResolvedValueOnce({ rows: mockMenuItems });
      mockClient.query.mockResolvedValueOnce({ rows: [{ order_number: 'ORD-001' }] });
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 'order-id', order_number: 'ORD-001', status: OrderStatus.PENDING }],
      });
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      await service.createOrder(customerId, createOrderDto);

      // Subtotal: (1500 * 2) + (800 * 1) = 3800
      // Tax: 3800 * 0.08 = 304
      // Delivery: 500
      // Total: 3800 + 304 + 500 = 4604
      const insertOrderCall = mockClient.query.mock.calls.find(
        (call) => call[0] && call[0].includes('INSERT INTO orders'),
      );
      expect(insertOrderCall).toBeDefined();
      expect(insertOrderCall[1]).toContain(3800); // subtotal_cents
    });

    it('should rollback transaction on error', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.createOrder(customerId, createOrderDto)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getOrderById', () => {
    const orderId = 'order-id';
    const userId = 'user-id';
    const userRole = 'customer';

    const mockOrder = {
      id: orderId,
      order_number: 'ORD-001',
      customer_id: userId,
      chef_id: 'chef-id',
      status: OrderStatus.PENDING,
      subtotal_cents: 3800,
      tax_cents: 304,
      delivery_fee_cents: 500,
      total_cents: 4604,
    };

    it('should return order for customer who owns it', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const result = await service.getOrderById(orderId, userId, userRole);

      expect(result).toBeDefined();
      expect(result.id).toBe(orderId);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT o.*'),
        expect.arrayContaining([orderId]),
      );
    });

    it('should throw ForbiddenException if customer tries to access another customer order', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...mockOrder, customer_id: 'other-customer-id' }],
      });

      await expect(service.getOrderById(orderId, userId, 'customer')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getOrderById(orderId, userId, userRole)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderById(orderId, userId, userRole)).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('listOrders', () => {
    const userId = 'user-id';
    const userRole = 'customer';

    it('should return filtered orders by status', async () => {
      const queryDto = { status: 'pending', page: '1', perPage: '20' };
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: 2 }] }); // Count query
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { id: 'order-1', order_number: 'ORD-001', status: OrderStatus.PENDING, chef_id: 'chef-id', chef_name: 'Test Chef', total_cents: 4604, created_at: new Date() },
          { id: 'order-2', order_number: 'ORD-002', status: OrderStatus.PENDING, chef_id: 'chef-id', chef_name: 'Test Chef', total_cents: 3500, created_at: new Date() },
        ],
      });

      const result = await service.listOrders(queryDto, userId, userRole);

      expect(result).toHaveProperty('orders');
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].status).toBe(OrderStatus.PENDING);
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('perPage', 20);
    });

    it('should return paginated results with page and perPage', async () => {
      const queryDto = { page: '1', perPage: '10' };
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: 25 }] }); // Count query
      mockDb.query.mockResolvedValueOnce({
        rows: Array(10).fill({ id: 'order-id', order_number: 'ORD-001', status: OrderStatus.PENDING, chef_id: 'chef-id', chef_name: 'Test Chef', total_cents: 4604, created_at: new Date() }),
      });

      const result = await service.listOrders(queryDto, userId, userRole);

      expect(result.orders).toHaveLength(10);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
      expect(result.totalPages).toBe(3); // 25 / 10 = 3 pages
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.anything(),
      );
    });

    it('should filter orders by chef ID for admin', async () => {
      const queryDto = { chefId: 'chef-id', page: '1', perPage: '20' };
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: 1 }] });
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'order-1', order_number: 'ORD-001', chef_id: 'chef-id', chef_name: 'Test Chef', status: OrderStatus.PENDING, total_cents: 4604, created_at: new Date() }],
      });

      const result = await service.listOrders(queryDto, userId, 'admin');

      expect(result.orders).toHaveLength(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('chef_id = $'),
        expect.anything(),
      );
    });
  });

  describe('cancelOrder', () => {
    const orderId = 'order-id';
    const userId = 'user-id';

    it('should cancel order and initiate refund if payment confirmed', async () => {
      const mockOrder = {
        id: orderId,
        order_number: 'ORD-001',
        customer_id: userId,
        chef_user_id: 'chef-user-id',
        status: OrderStatus.PAYMENT_CONFIRMED,
        total_cents: 4604,
        payment_intent_id: 'pi_test',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [mockOrder] }); // SELECT order
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // UPDATE order status
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // INSERT status history
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock initiateRefund internal DB calls
      mockDb.query.mockResolvedValueOnce({
        rows: [{ payment_intent_id: 'pi_test', total_cents: 4604 }],
      });
      mockStripeService.createRefund.mockResolvedValueOnce({ id: 'refund-id' });
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // INSERT refund

      const result = await service.cancelOrder(orderId, userId, 'Customer changed mind');

      expect(result).toHaveProperty('message');
      expect(result.refundInitiated).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders'),
        expect.arrayContaining([OrderStatus.CANCELLED]),
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT order - not found

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(NotFoundException);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw ForbiddenException if user does not own order', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: orderId, customer_id: 'other-user-id', chef_user_id: 'other-chef-user-id', status: OrderStatus.PENDING }],
      });

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(ForbiddenException);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error if order already delivered (invalid state transition)', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: orderId, order_number: 'ORD-001', customer_id: userId, chef_user_id: 'chef-user-id', status: OrderStatus.DELIVERED }],
      });

      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Order State Machine Integration', () => {
    it('should validate valid state transitions', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_CONFIRMED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.PAYMENT_CONFIRMED, OrderStatus.ACCEPTED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.ACCEPTED, OrderStatus.PREPARING)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP)).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.PENDING, OrderStatus.DELIVERED)).toBe(false);
      expect(OrderStateMachine.canTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING)).toBe(false);
      expect(OrderStateMachine.canTransition(OrderStatus.REFUNDED, OrderStatus.PENDING)).toBe(false);
    });

    it('should identify terminal states', () => {
      expect(OrderStateMachine.isTerminal(OrderStatus.DELIVERED)).toBe(true);
      expect(OrderStateMachine.isTerminal(OrderStatus.REFUNDED)).toBe(true);
      expect(OrderStateMachine.isTerminal(OrderStatus.PENDING)).toBe(false);
    });

    it('should identify states requiring refund', () => {
      expect(OrderStateMachine.requiresRefund(OrderStatus.PAYMENT_CONFIRMED)).toBe(true);
      expect(OrderStateMachine.requiresRefund(OrderStatus.ACCEPTED)).toBe(true);
      expect(OrderStateMachine.requiresRefund(OrderStatus.PENDING)).toBe(false);
      expect(OrderStateMachine.requiresRefund(OrderStatus.DELIVERED)).toBe(false);
    });
  });

  describe('Commission Calculations', () => {
    it('should calculate correct platform fee (15%)', () => {
      const subtotal = 10000; // $100.00
      const breakdown = CommissionCalculator.calculate(subtotal);

      expect(breakdown.platformFeeCents).toBe(1500); // $15.00
      expect(breakdown.chefEarningsCents).toBe(8500); // $85.00
    });

    it('should calculate correct tax (8%)', () => {
      const subtotal = 10000; // $100.00
      const breakdown = CommissionCalculator.calculate(subtotal);

      expect(breakdown.taxCents).toBe(800); // $8.00
    });

    it('should include default delivery fee', () => {
      const subtotal = 10000;
      const breakdown = CommissionCalculator.calculate(subtotal);

      expect(breakdown.deliveryFeeCents).toBe(500); // $5.00
    });

    it('should calculate correct total', () => {
      const subtotal = 10000; // $100.00
      const breakdown = CommissionCalculator.calculate(subtotal);

      // Total = subtotal + tax + delivery = 10000 + 800 + 500 = 11300
      expect(breakdown.totalCents).toBe(11300);
    });

    it('should use custom delivery fee if provided', () => {
      const subtotal = 10000;
      const customDeliveryFee = 1000; // $10.00
      const breakdown = CommissionCalculator.calculate(subtotal, customDeliveryFee);

      expect(breakdown.deliveryFeeCents).toBe(1000);
    });

    it('should calculate chef ledger entry correctly', () => {
      const subtotal = 10000;
      const ledgerEntry = CommissionCalculator.calculateChefLedgerEntry(subtotal);

      expect(ledgerEntry.type).toBe('order_earning');
      expect(ledgerEntry.amountCents).toBe(8500); // 85% of $100
    });

    it('should calculate driver ledger entry correctly', () => {
      const deliveryFee = 500;
      const ledgerEntry = CommissionCalculator.calculateDriverLedgerEntry(deliveryFee);

      expect(ledgerEntry.type).toBe('delivery_earning');
      expect(ledgerEntry.amountCents).toBe(500);
    });

    it('should calculate refund amounts proportionally', () => {
      const originalTotal = 11300; // $113.00
      const refundAmount = 5650; // $56.50 (50% refund)
      const refund = CommissionCalculator.calculateRefund(originalTotal, refundAmount);

      expect(refund.refundAmountCents).toBe(5650);
      expect(refund.chefRefundCents).toBeGreaterThan(0);
      expect(refund.platformRefundCents).toBeGreaterThan(0);
    });
  });
});
