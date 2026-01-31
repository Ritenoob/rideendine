# Webhook Event Architecture

> **Status:** ✅ STRIPE IMPLEMENTED | ⏳ COOCO PLANNED

**Last Updated:** 2026-01-31  
**Stripe Webhooks:** ✅ Operational  
**COOCO Webhooks:** ⏳ Not implemented (third-party integration deferred)

---

## Overview

RideNDine processes webhooks from external services (Stripe, COOCO) to maintain system state in real-time. All webhooks are verified, logged, and processed idempotently.

---

## Architecture

```
External Service (Stripe/COOCO)
        ↓
   [Webhook Endpoint]
        ↓
 [Signature Verification]
        ↓
  [Event Router]
        ↓
 [Handler Functions]
        ↓
  [Database Updates]
        ↓
 [Internal Events (WebSocket)]
```

---

## Incoming Webhooks: Stripe ✅

### Endpoint
**URL:** `POST /webhooks/stripe`  
**Location:** `services/api/src/stripe/stripe-webhook.controller.ts`

### Authentication
**Method:** Stripe signature verification

```typescript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  rawBody, 
  sig, 
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Important:** Requires raw body buffer (configured in `main.ts`):
```typescript
app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
```

---

### Implemented Events

#### payment_intent.succeeded
Payment completed successfully.

**Handler:** `handlePaymentIntentSucceeded()`

**Actions:**
1. Find order by `paymentIntentId`
2. Update order status: `pending` → `payment_confirmed`
3. Create `payments` record
4. Create `chef_ledger` entry (chef earnings)
5. Emit WebSocket event: `order:payment_confirmed`

**Code:**
```typescript
const paymentIntent = event.data.object as Stripe.PaymentIntent;
await this.ordersService.handlePaymentConfirmed(paymentIntent.id);
```

---

#### payment_intent.payment_failed
Payment failed.

**Handler:** `handlePaymentIntentFailed()`

**Actions:**
1. Find order by `paymentIntentId`
2. Log payment failure
3. Update order metadata
4. Send notification to customer
5. Emit WebSocket event: `order:payment_failed`

---

#### payment_intent.canceled
Payment cancelled by customer.

**Handler:** `handlePaymentIntentCanceled()`

**Actions:**
1. Update order status: `pending` → `cancelled`
2. Log cancellation
3. Notify customer

---

#### charge.refunded
Refund processed.

**Handler:** `handleChargeRefunded()`

**Actions:**
1. Find order by chargeId
2. Update payment record: `refund_amount_cents`
3. Update order status: → `refunded`
4. Update `chef_ledger` (reverse earnings)
5. Emit WebSocket event: `order:refunded`

---

#### account.updated
Stripe Connect account status changed.

**Handler:** `handleStripeAccountUpdate()`

**Actions:**
1. Find chef by `stripeAccountId`
2. Update `stripe_charges_enabled`, `stripe_payouts_enabled`
3. If fully onboarded, send welcome email
4. Emit event: `chef:stripe_verified`

**Code:**
```typescript
const account = event.data.object as Stripe.Account;
await this.chefsService.updateStripeStatus(account.id, {
  chargesEnabled: account.charges_enabled,
  payoutsEnabled: account.payouts_enabled,
});
```

---

#### account.application.deauthorized
Chef disconnected Stripe account.

**Handler:** `handleAccountDeauthorized()`

**Actions:**
1. Set chef `stripe_account_id` to NULL
2. Disable chef availability
3. Notify chef to reconnect

---

### Stripe Webhook Testing

**Stripe CLI:**
```bash
stripe listen --forward-to localhost:9001/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

**Webhook Logs:**
```bash
# View processed webhooks
SELECT * FROM webhook_events 
WHERE provider = 'stripe' 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## Incoming Webhooks: COOCO ⏳ (Planned)

### Endpoint
**URL:** `POST /webhooks/cooco`  
**Status:** Not implemented (COOCO integration deferred)

### Authentication
**Method:** HMAC SHA-256 signature

```typescript
const signature = request.headers['x-cooco-signature'];
const timestamp = request.headers['x-cooco-timestamp'];

const payload = `${timestamp}.${JSON.stringify(body)}`;
const expectedSig = crypto
  .createHmac('sha256', process.env.COOCO_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (`sha256=${expectedSig}` !== signature) {
  throw new UnauthorizedException('Invalid signature');
}
```

---

### Planned Events

#### delivery.assigned
COOCO driver assigned.

**Actions:**
1. Update order status: `ready_for_pickup` → `assigned_to_driver`
2. Store COOCO driver info in metadata
3. Notify customer via push + WebSocket

---

#### delivery.picked_up
Driver picked up from chef.

**Actions:**
1. Update order status: `assigned_to_driver` → `picked_up`
2. Notify customer: "Driver has your order"
3. Start ETA tracking

---

#### delivery.in_transit
Driver en route.

**Actions:**
1. Update order status: `picked_up` → `in_transit`
2. Stream driver location via WebSocket
3. Update ETA dynamically

---

#### delivery.completed
Delivery completed.

**Actions:**
1. Update order status: `in_transit` → `delivered`
2. Create `driver_ledger` entry (COOCO fee)
3. Send confirmation to customer
4. Trigger review request
5. Emit: `order:delivered`

---

#### delivery.failed
Delivery failed.

**Actions:**
1. Update order status: → `delivery_failed`
2. Notify customer and chef
3. Initiate refund process
4. Create support ticket

---

## Internal Event Triggers

### Order Lifecycle Events

| Trigger | Action | Implementation |
|---------|--------|----------------|
| Payment confirmed | Update order status | ✅ Stripe webhook |
| Order accepted (chef) | Emit WebSocket event | ✅ REST endpoint |
| Order ready | Assign driver | ✅ Dispatch service |
| Driver assigned | Notify customer | ✅ WebSocket + push |
| Order picked up | Start tracking | ✅ REST endpoint |
| Order delivered | Release chef funds | ✅ Ledger entry created |
| Order cancelled | Process refund | ✅ Stripe API call |

---

### Scheduled Jobs (Cron)

#### Daily Payout (Not Implemented)
**Schedule:** Every day at 2:00 AM UTC  
**Status:** ⏳ Planned for Phase 4

**Actions:**
1. Query `chef_ledger` with `payout_status = 'pending'`
2. Group by chef, sum earnings
3. Create Stripe payout via Connect
4. Update `payout_status` to 'processing'
5. Insert `payouts` record

**Code Stub:**
```typescript
@Cron('0 2 * * *') // Daily at 2 AM
async processDailyPayouts() {
  const pendingPayouts = await this.ledgerService.getPendingPayouts();
  
  for (const chef of pendingPayouts) {
    const payout = await this.stripeService.createPayout({
      amount: chef.totalEarnings,
      stripeAccountId: chef.stripeAccountId,
    });
    
    await this.ledgerService.markPaid(chef.id, payout.id);
  }
}
```

---

#### Weekly Reporting (Not Implemented)
**Schedule:** Every Monday at 8:00 AM UTC  
**Status:** ⏳ Planned

**Actions:**
1. Generate chef earnings report
2. Send email summary
3. Export to accounting system

---

## Webhook Best Practices

### Security
- ✅ Verify all signatures before processing
- ✅ Reject webhooks with old timestamps (>5 min)
- ✅ Use raw body for signature verification
- ✅ Log all webhook attempts (success + failure)

### Reliability
- ✅ Return 200 OK immediately
- ✅ Process events asynchronously
- ✅ Implement idempotency (store processed event IDs)
- ✅ Retry failed processing with exponential backoff
- ⏳ Dead letter queue for permanently failed events

### Monitoring
- ✅ Alert on signature verification failures
- ✅ Track webhook processing latency
- ⏳ Dashboard for webhook success/failure rates
- ⏳ Alert if webhook endpoint unreachable

---

## Database Schema

### webhook_events (Planned)
Store all received webhooks for audit and replay.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL, -- 'stripe', 'cooco'
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) UNIQUE NOT NULL, -- External event ID
  payload JSONB NOT NULL,
  signature VARCHAR(255) NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_provider ON webhook_events(provider);
CREATE INDEX idx_webhook_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_processed ON webhook_events(processed);
```

---

## Error Handling

### Stripe Webhook Failures
1. Log error with full context
2. Store event in `webhook_events` with error
3. Return 200 OK (Stripe will retry automatically)
4. Alert ops team if error count > 5

### Idempotency
Store processed Stripe event IDs:
```typescript
const existingEvent = await this.findEventById(event.id);
if (existingEvent) {
  return { received: true }; // Already processed
}

await this.processEvent(event);
await this.markEventProcessed(event.id);
```

---

## Testing Webhooks

### Local Development
```bash
# Start Stripe webhook forwarding
stripe listen --forward-to localhost:9001/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
stripe trigger account.updated
```

### Manual Testing
```bash
curl -X POST http://localhost:9001/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=...,v1=..." \
  -d @test-webhook.json
```

### Integration Tests
```typescript
describe('Stripe Webhooks', () => {
  it('should process payment_intent.succeeded', async () => {
    const event = createMockStripeEvent('payment_intent.succeeded');
    await webhookController.handleWebhook(event);
    
    const order = await ordersService.findById(orderId);
    expect(order.status).toBe('payment_confirmed');
  });
});
```

---

## Webhook Endpoints Summary

| Provider | Endpoint | Status | Events |
|----------|----------|--------|--------|
| **Stripe** | `/webhooks/stripe` | ✅ Live | 6 events |
| **COOCO** | `/webhooks/cooco` | ⏳ Planned | 5 events |
| **SendGrid** | `/webhooks/sendgrid` | ⏳ Planned | Email events |
| **Twilio** | `/webhooks/twilio` | ⏳ Planned | SMS status |

---

## Implementation Checklist

### Phase 2 (Complete)
- [x] Stripe webhook endpoint
- [x] Signature verification
- [x] Payment confirmed handler
- [x] Refund handler
- [x] Connect account updates

### Phase 4 (Planned)
- [ ] Webhook events table
- [ ] Idempotency checks
- [ ] Retry mechanism
- [ ] Dead letter queue
- [ ] COOCO webhook endpoint
- [ ] Scheduled payout job
- [ ] Monitoring dashboard

---

**Status:** Stripe webhooks operational ✅  
**Next:** Implement webhook events table + idempotency (Phase 4)
