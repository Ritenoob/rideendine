# Mobile API Quick Reference

Quick reference for all new mobile app endpoints.

---

## Driver App Endpoints

**Base URL:** `http://localhost:9001`

### Update Availability
```bash
PATCH /drivers/me/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "isAvailable": true
}
```

### Get Available Orders
```bash
GET /drivers/available-orders
Authorization: Bearer {token}

Response: Array of orders sorted by distance from driver
```

### Accept Order
```bash
POST /drivers/orders/{orderId}/accept
Authorization: Bearer {token}
Content-Type: application/json

{
  "estimatedPickupMinutes": 10  // optional
}
```

### Get Active Delivery
```bash
GET /drivers/me/active-delivery
Authorization: Bearer {token}

Response: Current active delivery or null
```

### Mark Picked Up
```bash
PATCH /drivers/orders/{orderId}/picked-up
Authorization: Bearer {token}
Content-Type: application/json

{
  "estimatedDeliveryMinutes": 15  // optional
}
```

### Mark Delivered
```bash
PATCH /drivers/orders/{orderId}/delivered
Authorization: Bearer {token}
Content-Type: application/json

{
  "deliveryPhotoUrl": "https://...",  // optional
  "notes": "Left at door"  // optional
}
```

### Get Earnings
```bash
GET /drivers/me/earnings?period={today|week|month|all}
Authorization: Bearer {token}

Response: {
  period, totalEarnings, deliveryCount, averagePerDelivery,
  breakdown: [{ date, earnings, deliveries }]
}
```

### Get Delivery History
```bash
GET /drivers/me/history?limit=20
Authorization: Bearer {token}

Response: Array of past deliveries with ratings
```

---

## Customer App Endpoints

### Save Address
```bash
POST /users/addresses
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Home",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",  // optional
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94102",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "deliveryInstructions": "Ring doorbell twice",  // optional
  "isDefault": true
}
```

### Get Saved Addresses
```bash
GET /users/addresses
Authorization: Bearer {token}

Response: Array of addresses (default first)
```

### Update Address
```bash
PATCH /users/addresses/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Work",  // any field optional
  "isDefault": true
}
```

### Delete Address
```bash
DELETE /users/addresses/{id}
Authorization: Bearer {token}

Response: { success: true }
```

---

## Payment Methods

### List Payment Methods
```bash
GET /payments/methods
Authorization: Bearer {token}

Response: {
  paymentMethods: [{
    id, type, card: { brand, last4, expMonth, expYear }
  }]
}
```

### Save Payment Method
```bash
POST /payments/methods
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethodId": "pm_...",  // from Stripe Payment Sheet
  "setAsDefault": true  // optional
}
```

### Remove Payment Method
```bash
DELETE /payments/methods/{id}
Authorization: Bearer {token}

Response: { success: true }
```

---

## Push Notifications

### Register Device Token
```bash
POST /notifications/token
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",  // or "android"
  "deviceId": "device-uuid"  // optional
}
```

### Unregister Token
```bash
DELETE /notifications/token
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

---

## Chef Endpoints

### Get Chef Menus
```bash
GET /chefs/{chefId}/menus

Response: [{
  id, name, description, isActive,
  items: [{ id, name, description, priceCents, isAvailable, ... }]
}]
```

### Get Chef Reviews
```bash
GET /chefs/{chefId}/reviews?limit=20&offset=0

Response: {
  reviews: [{ id, rating, comment, orderNumber, reviewerName, createdAt }],
  pagination: { total, limit, offset, hasMore },
  summary: { averageRating, totalReviews }
}
```

---

## Authentication

All endpoints require JWT authentication except chef public endpoints.

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  access_token: "eyJhbGc...",
  refresh_token: "eyJhbGc...",
  user: { id, email, role, ... }
}
```

### Use Token
```bash
Authorization: Bearer {access_token}
```

---

## Error Responses

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

Common status codes:
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (e.g., order already assigned)
- 500: Internal Server Error

---

## Development Tips

1. **Start API server:**
   ```bash
   cd services/api
   npm run start:dev
   ```

2. **Get auth token for testing:**
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:9001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"driver@test.com","password":"Password123!"}' \
     | jq -r '.access_token')
   ```

3. **Test any endpoint:**
   ```bash
   curl http://localhost:9001/drivers/available-orders \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Check API health:**
   ```bash
   curl http://localhost:9001/health
   ```

---

## Database Setup

Before using the new endpoints, run the migration:

```bash
cd /home/nygmaee/Desktop/rideendine
npm run db:migrate
```

This creates:
- `device_tokens` table
- `user_addresses` table
- Additional order columns (delivery_photo_url, estimated times)

---

## Testing Checklist

- [ ] Driver can update availability
- [ ] Driver sees available orders sorted by distance
- [ ] Driver can accept an order
- [ ] Driver can mark order as picked up
- [ ] Driver can mark order as delivered with photo
- [ ] Driver can view earnings breakdown
- [ ] Customer can save multiple addresses
- [ ] Default address is enforced (only one)
- [ ] Customer can save payment methods
- [ ] Payment methods show brand and last4
- [ ] Push notifications register successfully
- [ ] Chef menus load with all items
- [ ] Chef reviews show with pagination

