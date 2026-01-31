# Phase 2 Week 5 - Driver & Dispatch

## Status: COMPLETE

**Build:** SUCCESS  
**New Modules:** 2 (Drivers, Dispatch)  
**Endpoints Added:** 11 (7 driver + 4 dispatch)  
**Files Created:** 10  
**Database Migration:** 005_drivers.sql

---

## Implementation Summary

### 1. Driver Endpoints (7 total)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/drivers/register` | No | — | Register new driver |
| GET | `/drivers/profile` | Yes | Driver | Get driver profile |
| PATCH | `/drivers/profile` | Yes | Driver | Update vehicle info |
| PATCH | `/drivers/availability` | Yes | Driver | Go online/offline |
| POST | `/drivers/location` | Yes | Driver | Update GPS location |
| GET | `/drivers/stats` | Yes | Driver | Get earnings & stats |
| GET | `/drivers/location/history` | Yes | Driver | Get location history |

### 2. Dispatch Endpoints (4 total)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/dispatch/assign` | Yes | Admin/Chef | Assign driver to order |
| GET | `/dispatch/available-drivers` | Yes | Admin | Find available drivers near location |
| POST | `/dispatch/accept` | Yes | Driver | Accept assignment |
| POST | `/dispatch/decline` | Yes | Driver | Decline assignment |

### 3. Order Delivery Workflow (3 new endpoints)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| PATCH | `/orders/:id/pickup` | Yes | Driver | Mark order picked up |
| PATCH | `/orders/:id/in-transit` | Yes | Driver | Mark order in transit |
| PATCH | `/orders/:id/deliver` | Yes | Driver | Mark order delivered |

### 4. Database Schema (Migration 005)

**New Tables:**
- `drivers` - Driver profiles with vehicle info, verification status, performance metrics
- `driver_locations` - GPS tracking history (latitude, longitude, accuracy, speed, heading)
- `driver_assignments` - Order-to-driver assignments with status tracking
- `driver_ledger` - Driver earnings and payout tracking

**Enhanced Tables:**
- `orders` - Added `assigned_driver_id`, `assigned_at`, `estimated_delivery_time`, `actual_delivery_time`

**Database Functions:**
- `calculate_distance_km()` - Haversine formula for distance calculation
- `find_available_drivers_near()` - Find drivers within radius, sorted by distance and rating
- Triggers for updating driver location cache and stats

### 5. Driver Assignment Algorithm

```typescript
// Priority: Distance first, then rating for tie-breaking
1. Query all approved, available drivers
2. Calculate distance to chef location (Haversine)
3. Filter drivers within search radius (default 10km)
4. Sort by:
   - Distance (primary)
   - Average rating (tie-breaker if within 0.5km)
5. Assign to best match
```

**Estimated Pickup Time:**  
`distanceKm * 3 minutes` (20 km/h average speed)

### 6. Order State Machine Extensions

**New States:**
```
READY_FOR_PICKUP → ASSIGNED_TO_DRIVER → PICKED_UP → IN_TRANSIT → DELIVERED
```

**Driver Workflow:**
1. Chef marks order ready → `ready_for_pickup`
2. System/Admin assigns driver → `assigned_to_driver`
3. Driver accepts assignment → Updates `driver_assignments` status
4. Driver picks up from chef → `picked_up`
5. Driver en route to customer → `in_transit`
6. Driver completes delivery → `delivered`
   - Creates `driver_ledger` entry with earnings
   - Marks assignment as `completed`

### 7. GPS Tracking

**Location Updates:**
- POST `/drivers/location` with `{ latitude, longitude, accuracy, speed, heading }`
- Stored in `driver_locations` table
- Cached in `drivers.current_latitude/longitude` for fast queries
- Trigger auto-updates cache on location insert

**Location History:**
- GET `/drivers/location/history?limit=50`
- Returns recent GPS pings with timestamps
- Used for route replay and analytics

### 8. Driver Earnings

**On Order Delivery:**
- `delivery_fee_cents` (default $5.00)
- `tip_cents` (future: customer tipping)
- `total_earning_cents` = delivery_fee + tip
- `payout_status` = 'pending' (Week 6 will add Stripe payouts)

**Stats Tracking:**
- Total deliveries
- Successful deliveries
- Cancelled deliveries
- Average rating
- Total earnings
- Pending payouts

---

## Key Features

### Authorization
- Driver role added to `UserRole` enum
- Driver-only endpoints protected with `@Roles(UserRole.DRIVER)` guard
- Admin and Chef can trigger driver assignment

### Real-Time Readiness
- GPS tracking infrastructure ready for WebSocket integration (Week 6)
- Driver location updates designed for frequent pings (every 10 seconds)
- Distance-based search optimized with GIST spatial index

### Scalability
- Driver assignment algorithm handles large driver pools efficiently
- Spatial indexes on location columns for fast queries
- Configurable search radius (default 10km, adjustable per request)

---

## File Structure

```
services/api/src/
├── drivers/
│   ├── dto/
│   │   └── driver.dto.ts (158 lines)
│   ├── drivers.controller.ts (79 lines)
│   ├── drivers.service.ts (287 lines)
│   └── drivers.module.ts (12 lines)
│
├── dispatch/
│   ├── dto/
│   │   └── dispatch.dto.ts (52 lines)
│   ├── dispatch.controller.ts (70 lines)
│   ├── dispatch.service.ts (252 lines)
│   └── dispatch.module.ts (13 lines)
│
└── orders/
    ├── orders.controller.ts (updated +21 lines)
    └── orders.service.ts (updated +207 lines)

database/migrations/
└── 005_drivers.sql (268 lines)
```

---

## API Usage Examples

### Register Driver
```bash
POST /drivers/register
{
  "email": "driver@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Driver",
  "phoneNumber": "+15555551234",
  "vehicleType": "car",
  "vehicleMake": "Toyota",
  "vehicleModel": "Camry",
  "vehicleYear": 2020,
  "licensePlate": "ABC1234"
}
```

### Go Online
```bash
PATCH /drivers/availability
{ "isAvailable": true }
```

### Update Location (GPS Ping)
```bash
POST /drivers/location
{
  "latitude": 30.2672,
  "longitude": -97.7431,
  "accuracy": 10.5,
  "speed": 8.3,
  "heading": 45
}
```

### Assign Driver to Order
```bash
POST /dispatch/assign
{
  "orderId": "uuid-of-order",
  "searchRadiusKm": 15
}
# Returns: { driverId, driverName, distanceKm, estimatedPickupTimeMinutes }
```

### Driver Accepts Assignment
```bash
POST /dispatch/accept
{ "assignmentId": "uuid-of-assignment" }
```

### Driver Picks Up Order
```bash
PATCH /orders/:orderId/pickup
# Returns: { id, orderNumber, status: "picked_up" }
```

### Driver Delivers Order
```bash
PATCH /orders/:orderId/deliver
# Returns: { id, orderNumber, status: "delivered" }
# Side effect: Creates driver_ledger entry
```

---

## Next Steps (Week 6: Real-Time Features)

1. **WebSocket Gateway**
   - Real-time order status updates
   - Driver location streaming
   - Chef/Customer notifications

2. **Order Tracking**
   - Customer ETA calculations
   - Live driver position on map
   - Delivery progress timeline

3. **Push Notifications**
   - Order ready for pickup
   - Driver assigned
   - Driver arriving
   - Order delivered

4. **Dynamic ETA**
   - Integrate Mapbox/Google Routes API
   - Real-time traffic data
   - Update estimated delivery time

5. **Driver Payouts**
   - Stripe Connect for drivers
   - Automated weekly payouts
   - Payout history dashboard

---

**Week 5 Complete! 🎉**

**Total Phase 2 Progress:**
- Week 3: Chef Module (21 endpoints)
- Week 4: Orders Module (9 endpoints)
- Week 5: Driver & Dispatch (11 endpoints)
- **Total: 41 endpoints across 7 modules**
