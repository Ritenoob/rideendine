# COOCO Partner Interface Contract

> **Status:** ⚠️ NOT IMPLEMENTED — Third-party delivery integration planned for future.

**Last Updated:** 2026-01-31  
**Priority:** Low (Phase 4-5)  
**Alternative:** In-house driver system implemented (Phase 2 Week 5)

---

## Purpose

Defines the integration contract between RideNDine and COOCO (third-party delivery service) for delegating delivery fulfillment to external drivers.

**Current Status:** RideNDine has implemented its own driver management system. COOCO integration is deferred to future scaling phase when order volume justifies third-party delivery partnerships.

---

## Architecture Overview

```
RideNDine Platform
      ↓
   [API Gateway]
      ↓
 [COOCO Adapter Service]
      ↓
[COOCO API v2] (External)
      ↓
  COOCO Drivers
```

---

## Data Sent to COOCO

### POST /v2/deliveries (RideNDine → COOCO)

Create new delivery request.

**Request:**
```json
{
  "external_id": "RND-20260131-0001",
  "pickup": {
    "address": "123 Chef St, Austin, TX 78701",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "contact_name": "Chef John",
    "contact_phone": "+15555551234",
    "instructions": "Ring doorbell, kitchen entrance"
  },
  "dropoff": {
    "address": "456 Customer Ave, Austin, TX 78702",
    "latitude": 30.2750,
    "longitude": -97.7500,
    "contact_name": "Jane Doe",
    "contact_phone": "+15555559999",
    "instructions": "Leave at door"
  },
  "delivery_window": {
    "pickup_after": "2026-01-31T11:00:00Z",
    "deliver_by": "2026-01-31T12:00:00Z"
  },
  "package": {
    "description": "Food order (2 items)",
    "requires_signature": false,
    "fragile": true
  },
  "callback_url": "https://api.ridendine.com/webhooks/cooco",
  "metadata": {
    "order_id": "uuid",
    "chef_id": "uuid",
    "customer_id": "uuid"
  }
}
```

**Response:** `201 Created`
```json
{
  "delivery_id": "cooco-delivery-12345",
  "status": "pending",
  "estimated_pickup_time": "2026-01-31T11:15:00Z",
  "estimated_delivery_time": "2026-01-31T11:45:00Z",
  "tracking_url": "https://track.cooco.com/12345"
}
```

---

### GET /v2/deliveries/{id} (Poll Status)

Query delivery status.

**Response:** `200 OK`
```json
{
  "delivery_id": "cooco-delivery-12345",
  "external_id": "RND-20260131-0001",
  "status": "in_transit",
  "driver": {
    "name": "COOCO Driver",
    "phone": "+15555550000",
    "latitude": 30.2700,
    "longitude": -97.7450,
    "eta_minutes": 8
  },
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2026-01-31T11:00:00Z"
    },
    {
      "status": "driver_assigned",
      "timestamp": "2026-01-31T11:05:00Z"
    },
    {
      "status": "picked_up",
      "timestamp": "2026-01-31T11:20:00Z"
    },
    {
      "status": "in_transit",
      "timestamp": "2026-01-31T11:22:00Z"
    }
  ]
}
```

---

### PATCH /v2/deliveries/{id}/cancel (Cancel Delivery)

Cancel a delivery request.

**Request:**
```json
{
  "reason": "Customer cancelled order"
}
```

**Response:** `200 OK`
```json
{
  "delivery_id": "cooco-delivery-12345",
  "status": "cancelled",
  "cancellation_fee": 500
}
```

---

## Data Received from COOCO

### Webhook Events (COOCO → RideNDine)

**Endpoint:** `POST /webhooks/cooco`  
**Authentication:** HMAC signature in `X-COOCO-Signature` header

#### Event: delivery.assigned
Driver assigned to delivery.

```json
{
  "event": "delivery.assigned",
  "delivery_id": "cooco-delivery-12345",
  "external_id": "RND-20260131-0001",
  "timestamp": "2026-01-31T11:05:00Z",
  "data": {
    "driver": {
      "id": "cooco-driver-789",
      "name": "COOCO Driver",
      "phone": "+15555550000",
      "vehicle": "Toyota Camry - ABC123"
    },
    "estimated_pickup_time": "2026-01-31T11:15:00Z"
  }
}
```

**RideNDine Action:**
- Update order status to `assigned_to_driver`
- Store COOCO driver info in metadata
- Send notification to customer

---

#### Event: delivery.picked_up
Driver picked up from chef.

```json
{
  "event": "delivery.picked_up",
  "delivery_id": "cooco-delivery-12345",
  "external_id": "RND-20260131-0001",
  "timestamp": "2026-01-31T11:20:00Z",
  "data": {
    "pickup_photo_url": "https://cdn.cooco.com/photos/12345-pickup.jpg",
    "pickup_signature": "Chef John"
  }
}
```

**RideNDine Action:**
- Update order status to `picked_up`
- Notify customer: "Driver has your order"

---

#### Event: delivery.in_transit
Driver en route to customer.

```json
{
  "event": "delivery.in_transit",
  "delivery_id": "cooco-delivery-12345",
  "external_id": "RND-20260131-0001",
  "timestamp": "2026-01-31T11:22:00Z",
  "data": {
    "driver_latitude": 30.2700,
    "driver_longitude": -97.7450,
    "eta_minutes": 8
  }
}
```

**RideNDine Action:**
- Update order status to `in_transit`
- Stream driver location to customer via WebSocket

---

#### Event: delivery.completed
Delivery completed successfully.

```json
{
  "event": "delivery.completed",
  "delivery_id": "cooco-delivery-12345",
  "external_id": "RND-20260131-0001",
  "timestamp": "2026-01-31T11:45:00Z",
  "data": {
    "delivery_photo_url": "https://cdn.cooco.com/photos/12345-delivered.jpg",
    "recipient_signature": "Jane Doe",
    "delivered_at": {
      "latitude": 30.2750,
      "longitude": -97.7500
    }
  }
}
```

**RideNDine Action:**
- Update order status to `delivered`
- Create payment to COOCO for delivery fee
- Send confirmation to customer
- Trigger review request

---

#### Event: delivery.failed
Delivery failed or cancelled.

```json
{
  "event": "delivery.failed",
  "delivery_id": "cooco-delivery-12345",
  "external_id": "RND-20260131-0001",
  "timestamp": "2026-01-31T11:50:00Z",
  "data": {
    "reason": "customer_not_available",
    "driver_notes": "Called customer 3 times, no answer",
    "attempted_at": {
      "latitude": 30.2750,
      "longitude": -97.7500
    }
  }
}
```

**RideNDine Action:**
- Update order status to `delivery_failed`
- Notify customer and chef
- Initiate refund process
- Log incident for review

---

## Security

### Authentication
**Method:** API Key + HMAC signatures

**Outbound (RideNDine → COOCO):**
```
Authorization: Bearer <COOCO_API_KEY>
X-RideNDine-Request-ID: <uuid>
```

**Inbound (COOCO → RideNDine):**
```
X-COOCO-Signature: sha256=<hmac_signature>
X-COOCO-Timestamp: 1706702400
```

**Signature Verification:**
```typescript
const payload = `${timestamp}.${JSON.stringify(body)}`;
const expectedSignature = crypto
  .createHmac('sha256', COOCO_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  throw new Error('Invalid signature');
}
```

### Webhook Validation
- Verify HMAC signature
- Check timestamp (reject if >5 minutes old)
- Store processed webhook IDs to prevent replay attacks
- Return 200 OK immediately, process async

---

## Error Handling

### Retry Logic (RideNDine → COOCO)
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 5
- Timeout: 30 seconds per request

### Webhook Retry (COOCO → RideNDine)
COOCO will retry failed webhooks:
- Immediately
- After 1 minute
- After 5 minutes
- After 15 minutes
- After 1 hour

If all retries fail, alert RideNDine ops team.

---

## Fallback Strategy

If COOCO API is unavailable:
1. Queue delivery requests in Redis
2. Retry every 30 seconds
3. After 5 minutes, fall back to in-house driver system
4. Send alert to ops team

---

## Cost Structure

**Per Delivery:**
- Base fee: $3.00
- Distance fee: $0.50/km
- Peak time surcharge: +30% (5pm-8pm)
- Cancellation fee: $5.00 (if driver assigned)

**Billing:**
- Weekly invoices
- Net 7 payment terms
- Auto-debit from Stripe balance

---

## Implementation Checklist

### Backend (API Service)
- [ ] Create `cooco-adapter` service
- [ ] Implement delivery request mapping
- [ ] Build webhook receiver endpoint
- [ ] Add HMAC signature verification
- [ ] Create delivery status sync job
- [ ] Add fallback to in-house drivers

### Database
- [ ] Add `external_delivery_provider` column to orders
- [ ] Add `cooco_delivery_id` to orders
- [ ] Create `external_delivery_logs` table

### Monitoring
- [ ] Alert on COOCO API failures
- [ ] Track delivery success rate
- [ ] Monitor webhook processing latency
- [ ] Dashboard for COOCO deliveries

---

## Testing

### Sandbox Environment
```
Base URL: https://sandbox-api.cooco.com/v2
API Key: sk_test_...
Webhook Secret: whsec_test_...
```

### Test Scenarios
1. Create delivery → verify webhook received
2. Cancel delivery → verify cancellation fee
3. Simulate failed delivery → verify fallback
4. Test invalid signature → verify rejection

---

## Go-Live Criteria

- [ ] Contract signed with COOCO
- [ ] Sandbox testing 100% passing
- [ ] Webhook signature verification implemented
- [ ] Fallback to in-house drivers tested
- [ ] Cost monitoring dashboard live
- [ ] Ops team trained on incident response

---

**Status:** ⏳ Deferred to Phase 4-5  
**Priority:** Low (in-house driver system sufficient for MVP)  
**Decision:** Implement when order volume exceeds in-house driver capacity
