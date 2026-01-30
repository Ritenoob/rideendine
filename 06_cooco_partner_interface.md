# COOCO Partner Interface Contract

## Purpose
Defines how the platform exchanges data with COOCO for order fulfillment and delivery confirmation.

---

## Data Sent to COOCO
- Order ID
- Pickup location
- Dropoff location
- Delivery window
- Contact details

---

## Data Received from COOCO
- Delivery assigned
- Driver en route
- Delivery completed timestamp
- Delivery failure notice

---

## Security
- API Key authentication
- Signed webhooks
- Retry logic on failure
