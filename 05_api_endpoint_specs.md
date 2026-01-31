# API Endpoint Specifications

> **Status:** 🔶 PARTIAL — Core demo server implements some endpoints. Full spec not yet built.

## Orders
POST /api/orders
- Create new order
- Inputs: customer_id, chef_id, items, total_amount
- Output: order_id, status

GET /api/orders/{id}
- Retrieve order status

PATCH /api/orders/{id}/status
- Update order lifecycle (accepted, preparing, delivering, delivered)

---

## Payments
POST /api/payments/intent
- Create Stripe PaymentIntent
- Input: order_id, amount
- Output: payment_intent_id

POST /api/payments/refund
- Refund payment

---

## Payouts
POST /api/payouts/run
- Execute daily batch payouts

GET /api/payouts/{chef_id}
- Retrieve payout history
