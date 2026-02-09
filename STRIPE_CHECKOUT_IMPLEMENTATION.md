# Stripe Checkout & Order Tracking Implementation

## Summary

Full implementation of Stripe Checkout Sessions and public order tracking for the RideNDine platform.

## Files Created

### 1. `/services/api/src/stripe/dto/payments.dto.ts`
- `AddressDto` - Delivery address with optional lat/lng
- `CartItemDto` - Cart item with menu item ID, name, quantity, price
- `CreateCheckoutSessionDto` - Request DTO for creating checkout sessions
- `CheckoutSessionResponseDto` - Response with session URL and order info

### 2. `/services/api/src/orders/interfaces/order.interface.ts`
- `OrderStatus` enum - All order states
- `PaymentStatus` enum - Payment states
- `Order` interface - Complete order structure
- `OrderTrackingData` interface - Public tracking data (redacted)

### 3. `/services/api/src/common/decorators/public.decorator.ts`
- `@Public()` decorator for bypassing JWT auth on specific endpoints

### 4. `/database/migrations/011_stripe_checkout_session.sql`
- Adds `stripe_checkout_session_id` column to orders table
- Adds `stripe_payment_intent_id` column
- Adds `payment_confirmed_at` timestamp
- Adds `tip_cents` column
- Creates indexes for faster lookups

## Files Modified

### 1. `/services/api/src/stripe/stripe.service.ts`
**Added methods:**
- `createCheckoutSession()` - Creates Stripe Checkout Session with line items
- `retrieveCheckoutSession()` - Retrieves session by ID

### 2. `/services/api/src/stripe/payments.controller.ts`
**Added endpoints:**
- `POST /payments/create-checkout-session` - Creates checkout session and pending order
  - Validates chef exists and has Stripe account
  - Calculates totals using CommissionCalculator
  - Creates order in database with PENDING status
  - Creates Stripe Checkout Session
  - Returns session URL and order info

### 3. `/services/api/src/stripe/stripe-webhook.controller.ts`
**Added webhook handler:**
- `checkout.session.completed` - Handles successful checkout
  - Updates order status to PAYMENT_CONFIRMED
  - Creates payment record
  - Triggers Mealbridge dispatch (placeholder)

### 4. `/services/api/src/orders/orders.service.ts`
**Added methods:**
- `createOrderForCheckout()` - Creates order with PENDING status for checkout flow
- `updateCheckoutSession()` - Updates order with session ID
- `handleCheckoutCompleted()` - Handles checkout completion webhook
- `dispatchToMealbridge()` - Triggers dispatch (placeholder)
- `getOrderTracking()` - PUBLIC endpoint with redacted tracking data
- `calculateHaversineDistance()` - Calculates distance for ETA
- `toRad()` - Converts degrees to radians

### 5. `/services/api/src/orders/orders.controller.ts`
**Modified endpoint:**
- `GET /orders/:id/tracking` - Made PUBLIC with `@Public()` decorator
  - No authentication required
  - Returns REDACTED tracking data:
    - Order status
    - ETA minutes
    - Driver status message (generic)
    - Pickup label: "Local chef kitchen" (NEVER actual address)
    - NO driver location coordinates
    - NO chef address

### 6. `/services/api/src/orders/dto/order-tracking.dto.ts`
**Restructured:**
- `OrderTrackingDto` (class) - PUBLIC redacted tracking data
- `OrderTrackingFullDto` (interface) - INTERNAL full tracking with locations

### 7. `/services/api/src/common/guards/jwt-auth.guard.ts`
**Enhanced:**
- Added Reflector support
- Checks for `@Public()` decorator
- Bypasses authentication if endpoint is marked public

## Security Features

### Address Redaction
- Public tracking endpoint NEVER reveals:
  - Actual chef address or location
  - Driver precise location
  - Customer address
- Only shows:
  - Generic "Local chef kitchen" label
  - Status messages ("Driver en route", "Delivering your order")
  - ETA in minutes (calculated from driver distance)

### Authentication
- Checkout requires JWT auth (customer only)
- Order tracking is PUBLIC (no auth)
- Webhook signature verification required

## API Flow

### Checkout Flow
```
1. Customer → POST /payments/create-checkout-session
   - Validates chef and menu items
   - Calculates commission and fees
   - Creates order (status: PENDING)
   - Creates Stripe Checkout Session
   - Returns session URL

2. Customer redirected to Stripe Checkout
   - Completes payment

3. Stripe → POST /webhooks/stripe (checkout.session.completed)
   - Updates order (status: PAYMENT_CONFIRMED)
   - Creates payment record
   - Triggers Mealbridge dispatch

4. Customer → GET /orders/:id/tracking
   - Public endpoint (no auth)
   - Returns redacted tracking data
```

### Order States
```
PENDING → PAYMENT_CONFIRMED → ACCEPTED → PREPARING → 
READY_FOR_PICKUP → ASSIGNED_TO_DRIVER → PICKED_UP → 
IN_TRANSIT → DELIVERED
```

Alternate paths:
- `PENDING → CANCELLED` (no refund needed)
- `PAYMENT_CONFIRMED+ → REFUNDED` (requires Stripe refund)

## Commission Structure

Implemented via `CommissionCalculator.calculate()`:
- Platform fee: 15% of subtotal
- Tax: 8% of subtotal  
- Delivery fee: $5.00 fixed
- Chef earnings: 85% of subtotal
- Total: subtotal + tax + delivery_fee + (optional tip)

## Testing

### Manual Testing

**Create Checkout Session:**
```bash
curl -X POST http://localhost:9001/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chefId": "uuid",
    "items": [{
      "menuItemId": "uuid",
      "name": "Chicken Tikka Masala",
      "quantity": 2,
      "price": 1299
    }],
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102"
    },
    "successUrl": "https://app.ridendine.com/order/success",
    "cancelUrl": "https://app.ridendine.com/cart"
  }'
```

**Track Order (NO AUTH):**
```bash
curl http://localhost:9001/orders/{orderId}/tracking
```

**Test Webhook:**
```bash
stripe listen --forward-to localhost:9001/webhooks/stripe
stripe trigger checkout.session.completed
```

## TODO / Future Enhancements

1. **Mealbridge Integration**
   - Implement actual dispatch in `dispatchToMealbridge()`
   - Add IntegrationsService injection to OrdersService

2. **Promo Codes**
   - Validate promo code in checkout
   - Apply discounts

3. **Tips**
   - Track tip separately
   - Include in driver earnings calculation

4. **Enhanced Tracking**
   - Real-time WebSocket updates
   - Driver location animation
   - Live ETA updates

5. **Error Handling**
   - Payment failed recovery flow
   - Timeout handling for stuck payments

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ridendine
DATABASE_PASSWORD=ridendine_dev_password
DATABASE_NAME=ridendine_dev

# JWT
JWT_SECRET=your-secret-key
```

## Migration

Run migration to add required columns:
```bash
psql $DATABASE_URL -f database/migrations/011_stripe_checkout_session.sql
```

---

**Implementation Date:** 2026-01-31  
**Status:** ✅ Complete - Ready for testing
