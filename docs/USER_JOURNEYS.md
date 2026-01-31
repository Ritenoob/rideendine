# RideNDine User Journeys

Complete user flow documentation for all roles in the RideNDine platform.

**Last Updated:** 2026-01-31
**Status:** Phase 3 Complete

---

## Table of Contents

1. [Customer Journey](#customer-journey)
2. [Chef Journey](#chef-journey)
3. [Driver Journey](#driver-journey)
4. [Admin Journey](#admin-journey)
5. [Sequence Diagrams](#sequence-diagrams)

---

## Customer Journey

### Overview

The customer journey focuses on discovering home chefs, placing orders, and tracking delivery in real-time.

### Journey Stages

```
Registration → Discovery → Ordering → Payment → Tracking → Completion → Review
```

---

### 1. Registration & Onboarding

**Goal:** Create an account and verify email

#### Steps

1. **Open App**
   - Launch customer mobile app
   - See welcome screen with "Login" and "Sign Up" buttons

2. **Sign Up**
   - Tap "Sign Up"
   - Enter email, password, name, phone number
   - Role automatically set to "customer"
   - API: `POST /auth/register`

3. **Email Verification**
   - Receive verification email
   - Click verification link
   - Email confirmed
   - Return to app

4. **Location Permission**
   - App requests location permission
   - Grant permission for chef discovery
   - Location stored as default delivery address (optional)

#### Success Criteria

- ✅ Account created
- ✅ Email verified
- ✅ Location permission granted
- ✅ Ready to browse chefs

---

### 2. Chef Discovery

**Goal:** Find home chefs near the customer

#### Steps

1. **Home Screen Load**
   - App gets current location (GPS)
   - API: `GET /chefs/search?lat=30.2672&lng=-97.7431&radius=10`
   - Display list of nearby chefs

2. **Browse Chefs**
   - See chef cards with:
     - Business name
     - Cuisine types
     - Distance (e.g., "2.3 km away")
     - Rating (e.g., 4.8 ⭐)
     - Sample menu photo

3. **Filter & Search**
   - Filter by cuisine type (Italian, Mexican, etc.)
   - Filter by rating (4+ stars)
   - Adjust search radius (5km, 10km, 15km)

4. **View Chef Profile**
   - Tap on chef card
   - Navigate to Chef Detail screen
   - API: `GET /chefs/:id`
   - See:
     - Full description
     - Operating hours
     - Delivery radius
     - Minimum order amount
     - Full menu
     - Customer reviews

#### Success Criteria

- ✅ Chefs loaded based on location
- ✅ Can filter by cuisine/rating
- ✅ Can view chef profile and menu

---

### 3. Menu Browsing & Cart

**Goal:** Select menu items and add to cart

#### Steps

1. **Browse Menu**
   - API: `GET /chefs/:id/menus`
   - See menu categories (Appetizers, Mains, Desserts)
   - View menu items with:
     - Name, description
     - Price (e.g., $15.99)
     - Prep time (e.g., "25 min")
     - Dietary tags (vegetarian, gluten-free)

2. **View Item Details**
   - Tap menu item
   - See full description, ingredients, allergens
   - View larger photo

3. **Add to Cart**
   - Select quantity
   - Add special instructions (optional)
   - Tap "Add to Cart"
   - Cart badge updates (e.g., "3 items")

4. **Review Cart**
   - Tap cart icon
   - See cart screen with:
     - All items + quantities
     - Subtotal
     - Tax estimate
     - Delivery fee
     - Platform fee
     - Total

5. **Modify Cart**
   - Change quantities
   - Remove items
   - Add more items from same chef

**Note:** Cart is chef-specific (can't mix orders from multiple chefs)

#### Success Criteria

- ✅ Items added to cart
- ✅ Cart persists across sessions
- ✅ Pricing calculated correctly

---

### 4. Checkout & Payment

**Goal:** Complete order and process payment

#### Steps

1. **Proceed to Checkout**
   - Tap "Checkout" from cart
   - Navigate to Checkout screen

2. **Enter Delivery Details**
   - Confirm/edit delivery address
   - Add delivery instructions (e.g., "Ring doorbell")
   - Select/add tip amount (15%, 18%, 20%, custom)

3. **Create Order**
   - API: `POST /orders`
   - Request body:
     ```json
     {
       "chefId": "uuid",
       "deliveryAddress": "456 Customer St",
       "deliveryLatitude": 30.275,
       "deliveryLongitude": -97.75,
       "items": [{ "menuItemId": "uuid", "quantity": 2, "notes": "Extra spicy" }],
       "deliveryInstructions": "Ring doorbell",
       "tipAmountCents": 300
     }
     ```
   - Response: Order created with ID

4. **Payment**
   - API: `POST /orders/:id/create-payment-intent`
   - Receive `clientSecret`
   - Initialize Stripe Payment Sheet
   - Customer enters card details (or uses saved card)
   - Confirm payment
   - Stripe processes payment

5. **Payment Success**
   - Webhook: `payment_intent.succeeded`
   - Order status → `payment_confirmed`
   - Navigate to Order Confirmation screen

#### Success Criteria

- ✅ Order created in database
- ✅ Payment processed successfully
- ✅ Order status updated
- ✅ Chef notified

---

### 5. Order Tracking

**Goal:** Track order preparation and delivery in real-time

#### Steps

1. **Order Confirmation Screen**
   - See order number (e.g., "RND-20260131-0001")
   - Estimated delivery time
   - Order details recap
   - Tap "Track Order" button

2. **Tracking Screen Load**
   - Navigate to Order Tracking screen
   - API: `GET /orders/:id/tracking`
   - WebSocket: Connect to `/realtime`
   - WebSocket: `socket.emit('subscribe:order', { orderId })`

3. **Real-Time Updates**
   - **Status Timeline:**
     - ✅ Payment confirmed (10:00 AM)
     - ✅ Chef accepted (10:02 AM)
     - ⏳ Preparing food... (current)
     - ⏱️ Ready for pickup
     - ⏱️ Driver assigned
     - ⏱️ Out for delivery
     - ⏱️ Delivered

   - **WebSocket Events:**
     - `order:status_update` → Update timeline
     - `driver:location_update` → Update map marker
     - `order:eta_update` → Update ETA countdown

4. **Driver Assigned**
   - Status → `assigned_to_driver`
   - See driver info:
     - Name
     - Vehicle type
     - Photo
     - Rating
   - Map shows:
     - Chef location (pickup)
     - Driver location (live)
     - Customer location (delivery)

5. **Live Map Tracking**
   - Driver location updates every 10 seconds
   - Animated marker movement
   - Route line from driver → customer
   - ETA countdown (e.g., "12 minutes away")

6. **Delivery Notification**
   - Status → `delivered`
   - Push notification: "Your order has been delivered!"
   - WebSocket disconnects

#### Success Criteria

- ✅ Real-time status updates
- ✅ Live driver location tracking
- ✅ Accurate ETA calculation
- ✅ Push notifications work

---

### 6. Order Completion & Review

**Goal:** Confirm delivery and provide feedback

#### Steps

1. **Receive Order**
   - Driver marks order as delivered
   - Customer receives food
   - App shows "Order Delivered" screen

2. **Review Prompt**
   - See review prompt for:
     - Chef (food quality, accuracy)
     - Driver (delivery speed, professionalism)

3. **Submit Reviews**
   - **Chef Review:**
     - API: `POST /reviews`
     - Body: `{ revieweeId: chef.id, revieweeType: 'chef', rating: 5, comment: 'Amazing food!' }`
   - **Driver Review:**
     - API: `POST /reviews`
     - Body: `{ revieweeId: driver.id, revieweeType: 'driver', rating: 5, comment: 'Fast delivery!' }`

4. **Order History**
   - Navigate to "Orders" tab
   - API: `GET /orders?customerId=...`
   - See list of past orders
   - Tap order → see full details
   - "Reorder" button → add same items to cart

#### Success Criteria

- ✅ Order marked as delivered
- ✅ Reviews submitted
- ✅ Ratings updated for chef/driver
- ✅ Order appears in history

---

## Chef Journey

### Overview

The chef journey focuses on onboarding, menu management, accepting orders, and managing earnings.

### Journey Stages

```
Registration → Verification → Stripe Onboarding → Menu Setup → Order Management → Earnings
```

---

### 1. Chef Registration & Application

**Goal:** Apply to become a chef on the platform

#### Steps

1. **Sign Up**
   - API: `POST /auth/register`
   - Role: `customer` (will upgrade to chef)
   - Email verification

2. **Apply as Chef**
   - Navigate to "Become a Chef" in app/website
   - API: `POST /chefs`
   - Provide:
     - Business name
     - Business address (with geocoding)
     - Cuisine types (Italian, Mexican, etc.)
     - Business phone
     - Description

3. **Upload Documents**
   - API: `POST /chefs/:id/documents`
   - Upload:
     - Business license
     - Food handler's certificate
     - Insurance (liability)
     - ID proof

4. **Admin Review**
   - Status: `pending` verification
   - Admin reviews application
   - Admin verifies documents
   - Admin approves/rejects

5. **Approval Notification**
   - API: `PATCH /admin/chefs/:id/verify`
   - Status → `approved`
   - Email: "Congratulations! You're approved"
   - Next step: Stripe onboarding

#### Success Criteria

- ✅ Chef profile created
- ✅ Documents uploaded
- ✅ Admin approved
- ✅ Ready for Stripe onboarding

---

### 2. Stripe Connect Onboarding

**Goal:** Connect Stripe account to receive payments

#### Steps

1. **Start Onboarding**
   - Chef dashboard shows "Complete Stripe Setup" banner
   - Click "Setup Payments"
   - API: `POST /chefs/:id/stripe/onboard`
   - Receive Stripe AccountLink URL

2. **Stripe Onboarding Flow**
   - Redirect to Stripe Connect onboarding
   - Provide:
     - Business type (Individual/Company)
     - Business details
     - Bank account info
     - Tax information (SSN/EIN)

3. **Complete Onboarding**
   - Submit Stripe form
   - Webhook: `account.updated`
   - Update `chef.stripe_onboarding_complete = true`
   - Redirect back to app

4. **Check Status**
   - API: `GET /chefs/:id/stripe/status`
   - Confirm:
     - `isOnboarded: true`
     - `chargesEnabled: true`
     - `payoutsEnabled: true`

#### Success Criteria

- ✅ Stripe account created
- ✅ Bank account linked
- ✅ Ready to receive payments
- ✅ Can accept orders

---

### 3. Menu Creation

**Goal:** Create menus and add menu items

#### Steps

1. **Create Menu**
   - Navigate to "Menus" tab in chef dashboard
   - Click "Create Menu"
   - API: `POST /chefs/:id/menus`
   - Provide:
     - Menu name (e.g., "Dinner Menu")
     - Description
     - Availability (days/hours)

2. **Add Menu Items**
   - Click "Add Item"
   - API: `POST /chefs/:chefId/menus/:menuId/items`
   - Provide:
     - Name (e.g., "Spaghetti Carbonara")
     - Description
     - Price ($15.99)
     - Category (Pasta)
     - Prep time (25 min)
     - Dietary tags (Vegetarian, Gluten-Free)
     - Photo upload (optional)

3. **Set Availability**
   - Toggle menu active/inactive
   - Set operating hours per day
   - API: `PATCH /chefs/:id/operating-hours`

4. **Preview Menu**
   - View menu as customer would see it
   - Test ordering flow

#### Success Criteria

- ✅ Menu created
- ✅ 5+ items added
- ✅ Photos uploaded
- ✅ Pricing set
- ✅ Menu published

---

### 4. Order Management

**Goal:** Receive, accept, and fulfill orders

#### Steps

1. **New Order Notification**
   - WebSocket: `order:new` event
   - Push notification: "New order from John D."
   - Chef dashboard shows order badge

2. **View Order Details**
   - Navigate to "Orders" tab
   - See order with:
     - Order number
     - Customer name
     - Items ordered
     - Total amount
     - Chef earnings
     - Delivery address
     - Estimated prep time

3. **Accept or Reject**
   - **Accept:**
     - API: `PATCH /orders/:id/accept`
     - Status → `accepted`
     - Customer notified
     - Start cooking timer
   - **Reject:**
     - API: `PATCH /orders/:id/reject`
     - Provide reason
     - Customer notified + refunded

4. **Mark Preparing**
   - Status → `preparing`
   - Customer sees "Chef is preparing your food"

5. **Mark Ready**
   - Food is ready
   - API: `PATCH /orders/:id/ready`
   - Status → `ready_for_pickup`
   - Trigger driver assignment

6. **Driver Pickup**
   - Driver arrives
   - Driver marks picked up
   - Status → `picked_up`
   - Food leaves chef's location

#### Success Criteria

- ✅ Order notifications received
- ✅ Can accept/reject orders
- ✅ Order status updates correctly
- ✅ Driver assigned automatically

---

### 5. Earnings & Analytics

**Goal:** Track earnings and view analytics

#### Steps

1. **View Dashboard**
   - API: `GET /chefs/:id/stats`
   - See metrics:
     - Total orders (453)
     - Total earnings ($38,475)
     - Average rating (4.8)
     - Pending payouts ($2,340)

2. **View Earnings History**
   - Filter by date range
   - See breakdown:
     - Order revenue
     - Platform fees deducted
     - Net earnings

3. **Stripe Dashboard**
   - Click "View Stripe Dashboard"
   - API: `POST /chefs/:id/stripe/dashboard-link`
   - Redirect to Stripe Express dashboard
   - View:
     - Payout schedule
     - Transaction history
     - Bank account details

4. **Request Payout**
   - Payouts happen automatically (daily)
   - Manual payout option in Stripe dashboard

#### Success Criteria

- ✅ Accurate earnings tracking
- ✅ Stripe payouts working
- ✅ Analytics dashboard functional

---

## Driver Journey

### Overview

The driver journey focuses on registration, going online, accepting deliveries, and tracking earnings.

### Journey Stages

```
Registration → Verification → Go Online → Accept Delivery → Pickup → Delivery → Earnings
```

---

### 1. Driver Registration

**Goal:** Sign up as a driver

#### Steps

1. **Sign Up**
   - API: `POST /drivers/register`
   - Provide:
     - Email, password, name, phone
     - Vehicle type (car, bike, scooter, motorcycle)
     - Vehicle make/model/year
     - License plate

2. **Upload Documents**
   - Driver's license photo
   - Insurance certificate
   - Vehicle registration

3. **Background Check**
   - Submit for background check (third-party service)
   - Wait for approval (1-3 days)

4. **Approval**
   - Admin reviews application
   - API: `PATCH /admin/drivers/:id/verify`
   - Status → `approved`
   - Email: "You're approved to drive!"

#### Success Criteria

- ✅ Driver account created
- ✅ Documents uploaded
- ✅ Background check passed
- ✅ Ready to go online

---

### 2. Go Online & Accept Deliveries

**Goal:** Start accepting delivery assignments

#### Steps

1. **Go Online**
   - Open driver mobile app
   - Toggle "Available" switch
   - API: `PATCH /drivers/availability { isAvailable: true }`
   - Start GPS tracking

2. **GPS Tracking**
   - App sends location every 10 seconds
   - API: `POST /drivers/location`
   - Body: `{ latitude, longitude, accuracy, speed, heading }`

3. **Receive Assignment**
   - Order becomes `ready_for_pickup`
   - Dispatch service finds nearest driver
   - API: `POST /dispatch/assign { orderId }`
   - WebSocket: `driver:new_assignment` event

4. **View Assignment Details**
   - Notification: "New delivery nearby"
   - See:
     - Chef address (pickup)
     - Customer address (delivery)
     - Distance (e.g., "2.3 km to pickup")
     - Estimated earnings ($5.00)
     - Estimated time (15 min)

5. **Accept or Decline**
   - **Accept:**
     - API: `POST /dispatch/accept { assignmentId }`
     - Navigate to pickup location
   - **Decline:**
     - API: `POST /dispatch/decline { assignmentId, reason }`
     - Offer sent to next driver

#### Success Criteria

- ✅ Driver is online
- ✅ GPS tracking active
- ✅ Assignments received
- ✅ Can accept/decline

---

### 3. Pickup & Delivery

**Goal:** Pick up food from chef and deliver to customer

#### Steps

1. **Navigate to Chef**
   - Map shows route to chef location
   - ETA displayed
   - Tap "Start Navigation" (opens Google Maps)

2. **Arrive at Chef**
   - Driver confirms arrival
   - Chef hands over food
   - Driver marks pickup
   - API: `PATCH /orders/:id/pickup`
   - Status → `picked_up`

3. **Navigate to Customer**
   - Map shows route to customer
   - API: `PATCH /orders/:id/in-transit`
   - Status → `in_transit`
   - GPS location broadcast to customer

4. **Deliver Order**
   - Arrive at customer location
   - Hand over food
   - Driver marks delivered
   - API: `PATCH /orders/:id/deliver`
   - Status → `delivered`
   - Earnings credited

5. **Earnings Update**
   - Delivery fee added to ledger
   - Display: "You earned $5.00!"
   - Tip (if any) added

#### Success Criteria

- ✅ Pickup confirmed
- ✅ Navigation works
- ✅ Customer receives food
- ✅ Order marked delivered
- ✅ Earnings recorded

---

### 4. Go Offline & View Earnings

**Goal:** End shift and review earnings

#### Steps

1. **Go Offline**
   - Toggle "Available" switch off
   - API: `PATCH /drivers/availability { isAvailable: false }`
   - GPS tracking stops

2. **View Stats**
   - API: `GET /drivers/stats`
   - See:
     - Total deliveries today (12)
     - Total earnings today ($60)
     - Average rating (4.9)
     - Pending payouts ($150)

3. **View Payout Schedule**
   - Payouts every week (Monday)
   - See payout history

#### Success Criteria

- ✅ Can go online/offline
- ✅ Earnings tracked correctly
- ✅ Payouts working

---

## Admin Journey

### Overview

The admin journey focuses on verification, dispute resolution, and platform management.

### Journey Stages

```
Login → Verify Users → Manage Orders → Resolve Disputes → View Analytics
```

---

### 1. Chef & Driver Verification

**Goal:** Verify new chefs and drivers

#### Steps

1. **Admin Dashboard**
   - Login with admin credentials
   - Navigate to "Pending Verifications"

2. **Review Chef Application**
   - See chef profile:
     - Business name
     - Address
     - Cuisine types
     - Documents uploaded

3. **Verify Documents**
   - Review business license
   - Verify food handler's certificate
   - Check insurance

4. **Approve or Reject**
   - **Approve:**
     - API: `PATCH /admin/chefs/:id/verify`
     - Body: `{ verificationStatus: 'approved', notes: 'All documents verified' }`
     - Email sent to chef
   - **Reject:**
     - Provide reason
     - Chef can reapply

#### Success Criteria

- ✅ Chefs verified
- ✅ Drivers verified
- ✅ Documents reviewed
- ✅ Notifications sent

---

### 2. Dispute Resolution

**Goal:** Resolve customer complaints and disputes

#### Steps

1. **View Disputes**
   - Navigate to "Disputes" tab
   - See open disputes

2. **Review Dispute**
   - See:
     - Order details
     - Customer complaint
     - Chef response
     - Evidence (photos, etc.)

3. **Issue Refund**
   - API: `POST /orders/:id/refund`
   - Specify amount
   - Process refund via Stripe

4. **Close Dispute**
   - Mark resolved
   - Send notification to both parties

#### Success Criteria

- ✅ Disputes reviewed
- ✅ Refunds processed
- ✅ Both parties notified

---

### 3. Platform Analytics

**Goal:** Monitor platform health and metrics

#### Steps

1. **Dashboard Overview**
   - Total users (customers, chefs, drivers)
   - Total orders (today, week, month)
   - Platform revenue
   - Active orders

2. **View Reports**
   - Top chefs by orders
   - Top drivers by deliveries
   - Order completion rate
   - Average delivery time

#### Success Criteria

- ✅ Metrics accurate
- ✅ Reports generated
- ✅ Platform healthy

---

## Sequence Diagrams

### Order Creation & Payment Flow

```
Customer App      API Service      Stripe          Chef App
     |                |               |                |
     |--POST /orders->|               |                |
     |                |--validate---->|                |
     |                |<--order_id----|                |
     |<--order_id-----|               |                |
     |                |               |                |
     |--POST payment-intent---------->|                |
     |<--client_secret----------------|                |
     |                |               |                |
     |--confirm payment-------------->|                |
     |                |               |                |
     |                |<--webhook-----|                |
     |                |--update status->               |
     |                |--WS: order:new--------------->|
     |                |               |                |
```

### Driver Assignment Flow

```
Order (ready)   Dispatch Service   Driver App    Customer App
     |                |                |                |
     |--trigger------>|                |                |
     |                |--find nearby-->|                |
     |                |--WS: assignment->               |
     |                |                |                |
     |                |<--accept-------|                |
     |                |--update order->|                |
     |                |--WS: driver assigned---------->|
     |                |                |                |
```

---

**Document Status:** ✅ Complete
**Last Updated:** 2026-01-31
**Next Review:** Before Phase 5
