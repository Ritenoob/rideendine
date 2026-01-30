# Webhook Event Architecture

## Incoming Webhooks (from COOCO)
POST /webhooks/cooco/delivery-status

Events:
- delivery_assigned
- driver_en_route
- delivery_completed
- delivery_failed

---

## Incoming Webhooks (from Stripe)
POST /webhooks/stripe

Events:
- payment_intent.succeeded
- charge.refunded
- payout.paid
- dispute.created

---

## Internal Triggers
- delivery_completed → mark order delivered
- order delivered → release chef funds
- daily cron → batch payout
