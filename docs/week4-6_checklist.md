# Phase 2 Weeks 4–6 Detailed Checklist

> Scope: Order Management (Week 4), Driver & Dispatch (Week 5), Real‑Time (Week 6)
> This checklist reflects current repo state and near‑term implementation sequence.

---

## Week 4 — Order Management

### API (services/api)
- [ ] Create `orders` module (`orders.module.ts`, `orders.service.ts`, `orders.controller.ts`)
- [ ] Endpoints:
  - [ ] `POST /orders` (create order, validate items/chef)
  - [ ] `GET /orders/:id` (role‑aware access)
  - [ ] `GET /orders` (filters: status, chef, customer, date range)
  - [ ] `PATCH /orders/:id/accept` (chef)
  - [ ] `PATCH /orders/:id/ready` (chef)
  - [ ] `PATCH /orders/:id/cancel` (customer/chef)
- [ ] Add status transition guard (state machine) with explicit allowed transitions
- [ ] Persist status history in `order_status_history`

### Payments (Stripe)
- [ ] Create Stripe PaymentIntent endpoint (server‑side)
- [ ] Store payment record in `payments`
- [ ] On webhook confirmation: mark `orders.status = payment_confirmed`
- [ ] Refund endpoint + status update (`refunded`)

### Notifications (stub for Week 6)
- [ ] Emit event on status change (internal event publisher)
- [ ] Placeholder for websocket/push handlers

### Tests
- [ ] Order creation happy‑path
- [ ] Status transition validation
- [ ] Payment confirmation webhook handling

---

## Week 5 — Driver & Dispatch

### API (services/api)
- [ ] Create `drivers` module (`drivers.module.ts`, `drivers.service.ts`, `drivers.controller.ts`)
- [ ] Endpoints:
  - [ ] `POST /drivers/register`
  - [ ] `GET /drivers/available-orders`
  - [ ] `POST /drivers/orders/:id/accept`
  - [ ] `POST /drivers/orders/:id/pickup`
  - [ ] `POST /drivers/orders/:id/deliver`
  - [ ] `POST /drivers/location` (GPS)
- [ ] Persist driver location in `drivers` table
- [ ] Use status transitions for pickup/deliver

### Dispatch Service Integration
- [ ] Wire API to `services/dispatch` `/assign` endpoint
- [ ] On order ready: request assignment + store driver assignment
- [ ] Reassignment logic for declined/timeouts (basic)

### Routing/ETA
- [ ] Wire API to `services/routing` `/route` for ETA calculation
- [ ] Implement `GET /orders/eta?orderId=...`

### Tests
- [ ] Driver accepts order and status transitions
- [ ] Location updates write to DB

---

## Week 6 — Real‑Time

### WebSocket / Realtime
- [ ] Decide source of truth (core demo vs API WS)
- [ ] If API WS:
  - [ ] Add WS gateway or separate realtime service
  - [ ] JWT auth for socket connection
  - [ ] Rooms: `order:{id}`, `driver:{id}`
- [ ] Broadcast order status updates
- [ ] Broadcast driver location updates

### Push Notifications
- [ ] Add `device_tokens` table + registration endpoint
- [ ] Trigger Expo push on:
  - [ ] order accepted
  - [ ] order ready
  - [ ] driver assigned
  - [ ] delivered

### Email Notifications
- [ ] SendGrid: notify chef on new order
- [ ] SendGrid: notify customer on status changes

### Tests
- [ ] WS auth + subscription
- [ ] WS order update broadcast

---

## Cross‑cutting Dependencies
- [ ] Ensure migration scripts apply **all** SQL files
- [ ] Keep `OrderStatus` enum aligned with DB statuses
- [ ] Update customer apps to use new API routes
