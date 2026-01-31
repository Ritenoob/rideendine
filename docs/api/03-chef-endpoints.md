# Week 3 API Endpoints - Chef & Admin Modules

Complete API reference for Week 3 implementation including Chef management, Menu management, Stripe Connect integration, and Admin verification.

---

## 🏠 Chef Management

### POST /chefs/apply
Submit an application to become a chef on the platform.

**Authentication:** Required (JWT, Role: chef)

**Request Body:**
```json
{
  "businessName": "Maria's Home Kitchen",
  "description": "Authentic Mexican cuisine made with love",
  "address": "123 Main St, San Francisco, CA 94102",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "cuisineTypes": ["mexican", "vegetarian"],
  "minimumOrderCents": 1500,
  "deliveryRadiusKm": 15,
  "operatingHours": {
    "monday": { "isOpen": true, "openTime": "11:00", "closeTime": "20:00" }
  }
}
```

**Response:** `201 Created`

**cURL Example:**
```bash
curl -X POST http://localhost:9001/chefs/apply \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"businessName": "Maria'\''s Kitchen", "address": "123 Main St"}'
```

---

### GET /chefs/search
Search chefs by location, cuisine, rating.

**Query Parameters:**
- `latitude`, `longitude`: Search origin
- `radiusKm`: Search radius (default: 10)
- `cuisineType`: Filter by cuisine
- `minRating`: Minimum rating (0-5)
- `sortBy`: distance|rating|orders

---

### GET /chefs/:id
Get public chef profile.

### PATCH /chefs/:id
Update chef profile (owner only).

### POST /chefs/:id/documents
Upload verification documents.

### POST /chefs/:id/toggle-vacation-mode
Toggle accepting orders.

---

## 💳 Stripe Connect

### POST /chefs/:id/stripe/onboard
Initiate Stripe Connect onboarding.

**Returns:** Onboarding URL to redirect chef to Stripe.

### GET /chefs/:id/stripe/status
Check Stripe account status.

### POST /webhooks/stripe
Stripe webhook handler (internal).

---

## 🍽️ Menu Management

### POST /chefs/:chefId/menus
Create menu.

### GET /menus/:id
Get menu with items.

### PATCH /menus/:id
Update menu.

### DELETE /menus/:id
Soft delete menu.

### POST /menus/:menuId/items
Add menu item.

### PATCH /menu-items/:id
Update menu item.

### DELETE /menu-items/:id
Soft delete menu item.

---

## 👨‍💼 Admin Endpoints

### GET /admin/chefs/pending
List pending chef applications.

**Authentication:** Required (JWT, Role: admin)

### PATCH /admin/chefs/:id/verify
Approve or reject chef.

**Request:**
```json
{
  "verification_status": "approved",
  "rejection_reason": "Optional if rejected"
}
```

---

## 🏥 Health Checks

### GET /health
System health with DB check.

### GET /health/ready
Readiness probe.

### GET /health/live
Liveness probe.

---

See full documentation at `/home/nygmaee/Desktop/rideendine/docs/api/03-chef-endpoints-full.md`
