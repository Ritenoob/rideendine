# Phase 2 Week 4 - Order Management

## Status: COMPLETE

**Build:** SUCCESS
**Endpoints:** 8 new order endpoints
**Files Modified:** 4
**Files Created:** 1 (migration)

---

## Implementation Summary

### 1. Order Endpoints (8 total)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/orders` | Yes | Customer | Create new order |
| GET | `/orders/:id` | Yes | Any | Get order details |
| GET | `/orders` | Yes | Any | List orders with filters |
| POST | `/orders/:id/create-payment-intent` | Yes | Customer | Create Stripe PaymentIntent |
| PATCH | `/orders/:id/accept` | Yes | Chef | Accept order |
| PATCH | `/orders/:id/reject` | Yes | Chef | Reject order |
| PATCH | `/orders/:id/ready` | Yes | Chef | Mark ready for pickup |
| PATCH | `/orders/:id/cancel` | Yes | Any | Cancel order |
| POST | `/orders/:id/refund` | Yes | Admin/Chef | Refund order |

### 2. Stripe Payment Integration

- **PaymentIntent Creation** - Creates payment with Connect destination charges
- **Application Fees** - Platform fee (15%) + tax automatically collected
- **Refunds** - Full and partial refund support
- **Webhook Handling** - `payment_intent.succeeded` and `payment_intent.payment_failed`

### 3. Order State Machine

Implemented full order lifecycle with valid transitions:

```
PENDING → PAYMENT_CONFIRMED → ACCEPTED → PREPARING → READY_FOR_PICKUP
                                                           ↓
                                            ASSIGNED_TO_DRIVER → PICKED_UP → DELIVERED

Cancel/Reject paths:
- PENDING → CANCELLED
- PAYMENT_CONFIRMED → CANCELLED/REJECTED → REFUNDED
- ACCEPTED/PREPARING/READY_FOR_PICKUP → CANCELLED → REFUNDED
```

### 4. Commission Calculator

- **Platform Fee:** 15% of subtotal
- **Tax:** 8% of subtotal
- **Delivery Fee:** $5.00 default (dynamic in Week 5)
- **Chef Earnings:** Subtotal - Platform Fee
- **Ledger Entries:** Created on payment confirmation

---

## Files Modified

### [stripe.service.ts](services/api/src/stripe/stripe.service.ts)
Added PaymentIntent methods:
- `createPaymentIntent()` - Create payment with Connect transfer
- `retrievePaymentIntent()` - Get payment status
- `cancelPaymentIntent()` - Cancel pending payment
- `createRefund()` - Process refunds
- `createOrRetrieveCustomer()` - Stripe customer management

### [orders.service.ts](services/api/src/orders/orders.service.ts)
Implemented all order operations:
- `listOrders()` - Paginated list with role-based filtering
- `createPaymentIntent()` - Payment flow initiation
- `acceptOrder()` - Chef accepts order
- `rejectOrder()` - Chef rejects with reason
- `markOrderReady()` - Ready for pickup notification
- `cancelOrder()` - Cancel with auto-refund
- `refundOrder()` - Manual refund processing
- `handlePaymentConfirmed()` - Webhook handler for payment success

### [stripe-webhook.controller.ts](services/api/src/stripe/stripe-webhook.controller.ts)
Added payment webhook handlers:
- `handlePaymentIntentSucceeded()` - Confirms payment, updates order status
- `handlePaymentIntentFailed()` - Logs payment failures

### [stripe.module.ts](services/api/src/stripe/stripe.module.ts)
Updated to handle circular dependency with OrdersModule

---

## Files Created

### [004_orders_enhancements.sql](database/migrations/004_orders_enhancements.sql)
New migration adding:
- `accepted_at`, `ready_at`, `picked_up_at`, `delivered_at`, `cancelled_at` timestamps
- `rejection_reason`, `cancellation_reason` text fields
- `delivery_instructions` text field
- `chef_earning_cents` on orders
- `menu_item_name`, `total_cents`, `notes` on order_items
- `refund_amount_cents` on payments
- Performance indexes

---

## Key Features

- **Role-Based Authorization:** Customers see their orders, Chefs see orders for their kitchen, Admins see all
- **State Machine Validation:** Invalid transitions throw clear error messages
- **Auto-Refund:** Cancellations and rejections automatically trigger refunds
- **Ledger Tracking:** Chef earnings recorded on payment confirmation
- **Stripe Connect:** Payments split between platform and chef automatically

---

## API Usage Examples

### Create Order
```bash
POST /orders
{
  "chefId": "uuid",
  "deliveryAddress": "123 Main St",
  "deliveryLatitude": 30.2672,
  "deliveryLongitude": -97.7431,
  "items": [
    { "menuItemId": "uuid", "quantity": 2, "notes": "Extra spicy" }
  ]
}
```

### Create Payment Intent
```bash
POST /orders/:id/create-payment-intent
# Returns: { clientSecret, paymentIntentId, amountCents }
```

### Chef Accepts Order
```bash
PATCH /orders/:id/accept
# Returns: { id, orderNumber, status: "accepted", message }
```

### Cancel Order
```bash
PATCH /orders/:id/cancel
{ "cancellationReason": "Customer requested" }
# Returns: { id, orderNumber, status: "cancelled", refundInitiated: true }
```

---

## Next Steps (Week 5: Driver & Dispatch)

1. **Driver Registration & Management**
   - POST /drivers/register
   - GET /drivers/profile
   - PATCH /drivers/availability

2. **Order Assignment**
   - Find available drivers near chef
   - Assignment algorithm (distance, rating)
   - Accept/decline flow

3. **GPS Tracking**
   - POST /drivers/location
   - Real-time location updates
   - ETA calculation with Mapbox

4. **Dispatch Service Integration**
   - Connect existing dispatch service to API
   - Automatic driver assignment on READY_FOR_PICKUP

---

**Week 4 Complete!**
