# Stripe Payment Integration - Testing Guide

**Status:** ✅ Code Complete - Ready for Testing  
**Date:** 2026-01-31  
**Prerequisites:** All code changes implemented, awaiting environment configuration

---

## Overview

All Stripe payment integration code is **complete**. This guide provides step-by-step instructions for testing the implementation once services are configured.

### What Was Built

1. **Chef Dashboard** - Stripe Connect onboarding UI (Next.js)
2. **Customer Mobile** - Real Stripe Payment Sheet integration (React Native)
3. **Backend API** - Ephemeral key endpoint + customer management (NestJS)

### Files Modified/Created

**Created (3 files):**
- `apps/chef-dashboard/src/app/dashboard/stripe/page.tsx` (326 lines)
- `apps/customer-mobile/src/hooks/useStripePayment.ts` (117 lines)
- `services/api/src/stripe/payments.controller.ts` (42 lines)

**Modified (8 files):**
- `apps/chef-dashboard/src/components/DashboardLayout.tsx` - Added nav
- `apps/chef-dashboard/.env.local` - Created with API URL
- `apps/customer-mobile/src/screens/order/CheckoutScreen.tsx` - Real payment
- `apps/customer-mobile/src/services/api.ts` - Ephemeral key method
- `services/api/src/stripe/stripe.service.ts` - Ephemeral key method
- `services/api/src/stripe/stripe.module.ts` - Registered controller
- `services/api/src/users/users.service.ts` - Customer ID storage

**Backups Created:**
All modified files have timestamped backups with format: `filename.bak.2026-01-31_HH-MM-SS.before-*`

---

## Environment Setup

### 1. Prerequisites

**Required Services:**
- PostgreSQL 16 (port 5432)
- Redis 7 (port 6379)
- Node.js 18+ and npm

**Required Stripe Keys:**
- Test Secret Key: `sk_test_...`
- Test Publishable Key: `pk_test_...`
- Webhook Secret: `whsec_...`

Get these from: https://dashboard.stripe.com/test/apikeys

---

### 2. Database Setup

```bash
# Start database (if not running)
cd /home/nygmaee/Desktop/rideendine
npm run db:up

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Create admin user (for approval workflows)
npm run create-admin
```

**Verify database:**
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -c "\dt"
```

**Expected tables:**
- users
- chefs
- orders
- payments
- chef_ledger
- driver_ledger
- admin_actions
- menu tables

---

### 3. Backend API Configuration

**File:** `services/api/.env`

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ridendine
DATABASE_PASSWORD=ridendine_dev_password
DATABASE_NAME=ridendine_dev

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Stripe (UPDATE WITH YOUR TEST KEYS)
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_abcdef1234567890...
STRIPE_CONNECT_ONBOARDING_REDIRECT=http://localhost:9001/api/stripe/connect/return
STRIPE_CONNECT_REFRESH_URL=http://localhost:9001/api/stripe/connect/refresh
```

**Start API:**
```bash
cd services/api
npm install
npm run start:dev
```

**Verify API:**
```bash
curl http://localhost:9001/health
# Expected: {"status":"ok","database":"connected","timestamp":"..."}
```

---

### 4. Chef Dashboard Configuration

**File:** `apps/chef-dashboard/.env.local` (already created)

```bash
NEXT_PUBLIC_API_URL=http://localhost:9001
```

**Start Dashboard:**
```bash
cd apps/chef-dashboard
npm install
npm run dev
```

**Verify Dashboard:**
Open http://localhost:3001 - should see login page

---

### 5. Customer Mobile Configuration

**File:** `apps/customer-mobile/.env`

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:9001
EXPO_PUBLIC_WS_URL=ws://localhost:9001

# Stripe Configuration (UPDATE WITH YOUR TEST KEY)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
```

**For Physical Device Testing:**
Replace `localhost` with your LAN IP:
```bash
# Find your LAN IP
hostname -I | awk '{print $1}'
# Example: 192.168.1.100

# Update .env
EXPO_PUBLIC_API_URL=http://192.168.1.100:9001
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:9001
```

**Start Mobile App:**
```bash
cd apps/customer-mobile
npm install
npx expo start --clear
```

**Verify Mobile:**
- Scan QR code with Expo Go app
- Should see login screen

---

## Testing Phase 1: Chef Stripe Onboarding

### Test 3.1: Chef Onboarding Flow (30 min)

**Objective:** Verify chefs can complete Stripe Connect onboarding

#### Step 1: Create Chef Account

1. **Open Chef Dashboard:** http://localhost:3001
2. **Register new account:**
   - Email: `chef.test@ridendine.com`
   - Password: `Test1234!`
   - First Name: `Test`
   - Last Name: `Chef`
   - Role: `chef` (should be auto-selected)
3. **Click "Sign Up"**
4. **Verify:** Redirected to login
5. **Login** with credentials

#### Step 2: Complete Chef Application

1. **Go to Settings** (if prompted to complete profile)
2. **Fill in chef details:**
   - Business Name: `Test Kitchen`
   - Cuisine Type: `Italian`
   - Description: `Test chef for Stripe integration`
   - Address: Any valid address
   - Minimum Order: `$15`
   - Delivery Radius: `5 miles`
3. **Submit Application**
4. **Verify:** Status = "pending approval"

#### Step 3: Approve Chef (Admin Action)

**Option A: Use Admin API**
```bash
# Get chef ID from database
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT id, business_name FROM chefs WHERE business_name = 'Test Kitchen';"

# Approve chef via API (requires admin token)
curl -X PATCH http://localhost:9001/admin/chefs/{CHEF_ID}/verify \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

**Option B: Direct Database Update**
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "UPDATE chefs SET verification_status = 'approved' WHERE business_name = 'Test Kitchen';"
```

#### Step 4: Start Stripe Onboarding

1. **Click "Stripe Payments"** in sidebar
2. **Verify:** See "Connect with Stripe" card
3. **Click "Start Stripe Onboarding"** button
4. **Verify:** Redirected to Stripe hosted form

#### Step 5: Complete Stripe Form

**Use Stripe Test Data:**
- **Business Type:** Individual
- **Country:** United States
- **First Name:** Test
- **Last Name:** Chef
- **Email:** chef.test@ridendine.com
- **Phone:** +1 555-000-0000
- **DOB:** 01/01/1990
- **SSN (last 4):** 0000
- **Address:** 123 Test St, San Francisco, CA 94102
- **Bank Account:**
  - Routing: 110000000
  - Account: 000123456789

**Submit form**

#### Step 6: Verify Completion

1. **Return to Dashboard** (should auto-redirect)
2. **Go to Stripe Payments page**
3. **Verify Status Card shows:**
   - ✅ Onboarding Complete
   - ✅ Charges Enabled
   - ✅ Payouts Enabled
4. **Click "Open Stripe Dashboard"**
5. **Verify:** Opens Stripe Express Dashboard

#### Step 7: Check Database

```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT id, business_name, stripe_account_id, stripe_charges_enabled 
      FROM chefs WHERE business_name = 'Test Kitchen';"
```

**Expected:**
- `stripe_account_id`: Should be `acct_...`
- `stripe_charges_enabled`: `true`

---

### ✅ Success Criteria - Chef Onboarding

- [ ] Chef can register and login
- [ ] Chef application submits successfully
- [ ] Stripe onboarding button appears
- [ ] Redirect to Stripe works
- [ ] Stripe form accepts test data
- [ ] Redirect back to dashboard works
- [ ] Status shows "Complete" with green checkmarks
- [ ] `stripe_account_id` stored in database
- [ ] `stripe_charges_enabled = true`
- [ ] Stripe Dashboard link opens

---

## Testing Phase 2: Customer Payment

### Test 3.2: Customer Payment Flow (30 min)

**Objective:** Verify customers can place orders and pay with Stripe Payment Sheet

**Prerequisites:**
- Chef onboarded (from Test 3.1)
- Chef has at least one menu item
- Mobile app running

#### Step 1: Create Menu Item (Chef)

1. **In Chef Dashboard:** Go to "Menu"
2. **Create Menu:**
   - Name: `Dinner Menu`
   - Description: `Dinner items`
   - Active: ✅
3. **Add Menu Item:**
   - Name: `Spaghetti Carbonara`
   - Description: `Classic Italian pasta`
   - Price: `$25.00`
   - Available: ✅

#### Step 2: Register Customer

1. **Open Mobile App** (Expo Go)
2. **Tap "Sign Up"**
3. **Register:**
   - Email: `customer.test@ridendine.com`
   - Password: `Test1234!`
   - First Name: `Test`
   - Last Name: `Customer`
4. **Submit**
5. **Login** with credentials

#### Step 3: Browse and Add to Cart

1. **Allow Location Access** when prompted
2. **Browse Chefs** - should see "Test Kitchen"
3. **Tap "Test Kitchen"**
4. **Tap "Spaghetti Carbonara"**
5. **Tap "Add to Cart"**
6. **Verify:** Cart badge shows "1"
7. **Tap Cart icon**

#### Step 4: Checkout

1. **Review Cart:**
   - Item: Spaghetti Carbonara - $25.00
   - Tax: $2.00 (8%)
   - Delivery: $5.00
   - Total: $32.00
2. **Tap "Proceed to Checkout"**
3. **Fill in Delivery Address:**
   - Street: `456 Customer St`
   - City: `San Francisco`
   - State: `CA`
   - Zip: `94102`
4. **Optional:** Add tip (e.g., $5.00)
5. **Tap "Place Order"**

#### Step 5: Complete Payment

**Stripe Payment Sheet should appear**

1. **Verify Payment Sheet:**
   - Merchant: "RideNDine"
   - Amount: $37.00 (with tip) or $32.00
   - Orange primary color
2. **Enter Test Card:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/34` (any future date)
   - CVC: `123`
   - Postal Code: `94102`
3. **Tap "Pay"**
4. **Wait for processing** (2-3 seconds)

#### Step 6: Verify Success

1. **Verify:** Payment Sheet closes
2. **Verify:** Navigated to Order Confirmation screen
3. **Verify:** Order number displayed (e.g., `RND-20260131-0001`)
4. **Verify:** Can view order details

#### Step 7: Check Backend

**Check order status:**
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT order_number, status, total_cents, stripe_payment_intent_id 
      FROM orders ORDER BY created_at DESC LIMIT 1;"
```

**Expected:**
- `status`: `payment_confirmed`
- `total_cents`: `3200` (or `3700` with tip)
- `stripe_payment_intent_id`: `pi_...`

**Check chef ledger:**
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT * FROM chef_ledger ORDER BY created_at DESC LIMIT 1;"
```

**Expected:**
- `amount_cents`: `2125` (85% of $25 subtotal)
- `type`: `order_earnings`
- `status`: `pending`

#### Step 8: Check Stripe Dashboard

1. **Open:** https://dashboard.stripe.com/test/payments
2. **Verify:** Latest payment exists
3. **Check Details:**
   - Amount: $32.00 (or $37.00)
   - Application Fee: $3.75 (15% of $25)
   - Transfer: To chef's Connect account
   - Metadata: `order_id`, `order_number`

---

### ✅ Success Criteria - Customer Payment

- [ ] Customer can register and login
- [ ] Can browse chefs with menus
- [ ] Can add items to cart
- [ ] Cart calculations are correct
- [ ] Checkout form validates
- [ ] Payment Sheet initializes without error
- [ ] Payment Sheet has RideNDine branding
- [ ] Test card 4242... is accepted
- [ ] Payment processes successfully
- [ ] Navigates to confirmation screen
- [ ] Order status = `payment_confirmed`
- [ ] Chef ledger entry created
- [ ] Payment visible in Stripe Dashboard
- [ ] Platform fee (15%) calculated correctly
- [ ] Customer ID stored in users table

---

## Testing Phase 3: Failure Scenarios

### Test 3.3: Payment Failures (30 min)

**Objective:** Verify graceful error handling for payment failures

#### Scenario 1: Declined Card

1. **Repeat Test 3.2 Steps 1-4** (create order)
2. **In Payment Sheet, use:**
   - Card: `4000 0000 0000 0002` (generic decline)
   - Expiry: `12/34`
   - CVC: `123`
3. **Tap "Pay"**
4. **Verify:**
   - ❌ Error message: "Your card was declined"
   - Payment Sheet remains open
   - Can try different card
5. **Try valid card:** `4242 4242 4242 4242`
6. **Verify:** Payment succeeds on retry

#### Scenario 2: Insufficient Funds

1. **Create new order**
2. **In Payment Sheet, use:**
   - Card: `4000 0000 0000 9995`
3. **Verify:**
   - ❌ Error: "Insufficient funds"
   - Order remains `pending` status

#### Scenario 3: Incorrect CVC

1. **Create new order**
2. **In Payment Sheet, use:**
   - Card: `4000 0000 0000 0127`
3. **Verify:**
   - ❌ Error message about CVC
   - Can correct and retry

#### Scenario 4: Payment Cancellation

1. **Create new order**
2. **Payment Sheet opens**
3. **Tap outside sheet to dismiss** (or swipe down)
4. **Verify:**
   - Sheet closes without error alert
   - Still on checkout screen
   - Can retry by tapping "Place Order" again
5. **Check order status:**
   ```bash
   psql ... -c "SELECT order_number, status FROM orders ORDER BY created_at DESC LIMIT 1;"
   ```
6. **Verify:** Status = `pending` (not failed)

#### Scenario 5: Network Error

1. **Stop API server:**
   ```bash
   # In API terminal, press Ctrl+C
   ```
2. **In mobile app, create order**
3. **Verify:**
   - Error: "Network error" or "Failed to initialize payment"
   - Order not created (or remains pending)
4. **Restart API server**
5. **Retry** - should succeed

---

### ✅ Success Criteria - Failure Handling

- [ ] Declined cards show clear error message
- [ ] Insufficient funds error is specific
- [ ] CVC errors are handled
- [ ] Payment cancellation doesn't show error
- [ ] Can retry payment after cancellation
- [ ] Network errors show appropriate message
- [ ] Failed orders remain in `pending` status
- [ ] No duplicate orders created on retry
- [ ] Error alerts are user-friendly
- [ ] Logs contain detailed error info

---

## Testing Phase 4: End-to-End Verification

### Test 3.4: Complete Flow Verification (30 min)

**Objective:** Verify the entire payment flow from chef onboarding to payment confirmation

#### Verification Checklist

**1. Chef Onboarding ✅**
```bash
# Verify chef is fully onboarded
psql ... -c "SELECT business_name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled 
             FROM chefs WHERE business_name = 'Test Kitchen';"
```

**Expected:**
- `stripe_account_id`: `acct_...`
- `stripe_charges_enabled`: `true`
- `stripe_payouts_enabled`: `true`

**2. Customer Created ✅**
```bash
# Verify customer has Stripe customer ID
psql ... -c "SELECT email, stripe_customer_id FROM users WHERE email = 'customer.test@ridendine.com';"
```

**Expected:**
- `stripe_customer_id`: `cus_...`

**3. Order Created ✅**
```bash
# Verify order details
psql ... -c "SELECT order_number, status, subtotal_cents, tax_cents, delivery_fee_cents, 
                    platform_fee_cents, total_cents, stripe_payment_intent_id 
             FROM orders WHERE order_number LIKE 'RND-2026%' ORDER BY created_at DESC LIMIT 1;"
```

**Expected:**
- `status`: `payment_confirmed`
- `subtotal_cents`: `2500` ($25)
- `tax_cents`: `200` (8%)
- `delivery_fee_cents`: `500` ($5)
- `platform_fee_cents`: `375` (15% of subtotal)
- `total_cents`: `3200` ($32)
- `stripe_payment_intent_id`: `pi_...`

**4. Payment Intent ✅**
```bash
# Verify payment record
psql ... -c "SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;"
```

**Expected:**
- `stripe_payment_intent_id`: matches order
- `amount_cents`: `3200`
- `status`: `succeeded`
- `application_fee_cents`: `375`

**5. Chef Earnings ✅**
```bash
# Verify chef ledger entry
psql ... -c "SELECT * FROM chef_ledger ORDER BY created_at DESC LIMIT 1;"
```

**Expected:**
- `amount_cents`: `2125` (85% of $25 subtotal)
- `type`: `order_earnings`
- `status`: `pending` (will be `paid` after payout)

**6. Stripe Dashboard ✅**

1. **Open:** https://dashboard.stripe.com/test/payments
2. **Find payment** (sort by newest)
3. **Verify:**
   - Amount: $32.00
   - Status: Succeeded
   - Application Fee: $3.75
   - Connected Account: chef's `acct_...`
   - Transfer: $21.25 to chef
4. **Check Transfer:**
   - Go to https://dashboard.stripe.com/test/connect/transfers
   - Verify transfer to chef account
   - Amount: $21.25

**7. Webhook Logs ✅**
```bash
# Check API logs for webhook
tail -f /path/to/api/logs/app.log | grep "payment_intent.succeeded"
```

**Expected:**
- `payment_intent.succeeded` event received
- Order status updated
- Chef ledger created
- No errors

---

### ✅ Final Success Criteria

- [ ] All database records created correctly
- [ ] Order status = `payment_confirmed`
- [ ] Platform fee calculated correctly (15%)
- [ ] Chef earnings calculated correctly (85%)
- [ ] Payment visible in Stripe Dashboard
- [ ] Application fee deducted
- [ ] Transfer to chef account initiated
- [ ] Webhook processed successfully
- [ ] No errors in logs
- [ ] Customer can view order history
- [ ] Chef can see order in dashboard (if implemented)

---

## Troubleshooting

### Issue: Payment Sheet Doesn't Appear

**Possible Causes:**
1. Missing or invalid `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Ephemeral key endpoint failing
3. Network error

**Debug Steps:**
```bash
# Check API logs
tail -f services/api/logs/app.log

# Test ephemeral key endpoint
curl -X POST http://localhost:9001/payments/ephemeral-key \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"

# Expected: {"ephemeralKey":"ek_test_...","customerId":"cus_..."}
```

**Fix:**
- Verify `.env` has correct Stripe publishable key
- Restart Expo with `--clear` flag
- Check user is authenticated (has valid JWT)

---

### Issue: "Failed to Create Ephemeral Key"

**Possible Causes:**
1. Stripe API key mismatch
2. API version mismatch
3. Customer creation failed

**Debug Steps:**
```bash
# Check Stripe service logs
grep "ephemeral" services/api/logs/app.log

# Verify Stripe keys
echo $STRIPE_SECRET_KEY | cut -c1-12
# Should start with: sk_test_

# Check API version
grep "apiVersion" services/api/src/stripe/stripe.service.ts
```

**Fix:**
- Ensure `apiVersion: '2026-01-28.clover'` matches
- Verify secret key is test mode (`sk_test_`)
- Check Stripe Dashboard logs

---

### Issue: Payment Succeeds but Order Status Not Updated

**Possible Causes:**
1. Webhook not configured
2. Webhook signature verification failing
3. Order ID not found

**Debug Steps:**
```bash
# Check webhook endpoint
curl -X POST http://localhost:9001/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"ping"}'

# Check webhook logs
grep "webhook" services/api/logs/app.log

# Manual status update (temporary)
psql ... -c "UPDATE orders SET status = 'payment_confirmed' WHERE order_number = 'RND-...';"
```

**Fix:**
- Test webhooks with Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:9001/webhooks/stripe
  stripe trigger payment_intent.succeeded
  ```
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check raw body parsing enabled in `main.ts`

---

### Issue: Chef Cannot Onboard

**Possible Causes:**
1. Chef not approved
2. Missing email
3. Stripe account creation failed

**Debug Steps:**
```bash
# Check chef status
psql ... -c "SELECT id, email, verification_status FROM chefs WHERE business_name = 'Test Kitchen';"

# Check Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/connect/accounts
```

**Fix:**
- Approve chef: `UPDATE chefs SET verification_status = 'approved' ...`
- Verify chef has email in users table
- Check API logs for Stripe errors

---

## Test Cards Reference

### Successful Payments

| Card Number | Brand | Use Case |
|-------------|-------|----------|
| 4242 4242 4242 4242 | Visa | Basic success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 3782 822463 10005 | Amex | Success |

### Failed Payments

| Card Number | Error | Use Case |
|-------------|-------|----------|
| 4000 0000 0000 0002 | Generic decline | Test error handling |
| 4000 0000 0000 9995 | Insufficient funds | Specific error |
| 4000 0000 0000 0127 | Incorrect CVC | Validation |
| 4000 0000 0000 0069 | Expired card | Expiry check |

### 3D Secure

| Card Number | Auth | Use Case |
|-------------|------|----------|
| 4000 0025 0000 3155 | Required | SCA testing |
| 4000 0027 6000 3184 | Required (decline) | Failed auth |

**Complete list:** https://stripe.com/docs/testing#cards

---

## Production Deployment Checklist

Before deploying to production:

### 1. Stripe Configuration

- [ ] Create production Stripe account
- [ ] Get live API keys from https://dashboard.stripe.com/apikeys
- [ ] Update all `.env` files with live keys:
  - `STRIPE_SECRET_KEY=sk_live_...`
  - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] Configure production webhook endpoint in Stripe Dashboard
- [ ] Point webhook to: `https://yourdomain.com/webhooks/stripe`
- [ ] Get production webhook secret: `whsec_live_...`
- [ ] Update `STRIPE_WEBHOOK_SECRET` in backend `.env`

### 2. Test with Real Card

- [ ] Place small test order ($0.50 - $1.00)
- [ ] Use real card (not test card)
- [ ] Verify payment succeeds
- [ ] Check Stripe Dashboard for live payment
- [ ] Verify webhook fired
- [ ] Check order status updated
- [ ] Verify chef ledger entry
- [ ] Initiate test refund if needed

### 3. Stripe Radar (Fraud Detection)

- [ ] Enable Stripe Radar
- [ ] Configure fraud rules
- [ ] Set up decline notification emails
- [ ] Test with risky test cards

### 4. Monitoring & Alerts

- [ ] Set up Stripe email notifications:
  - Failed payments
  - Disputed payments
  - Payout failures
- [ ] Add Stripe webhook monitoring
- [ ] Configure error logging (Sentry/LogRocket)
- [ ] Set up uptime monitoring (webhook endpoint)

### 5. Compliance & Legal

- [ ] Add Terms of Service (payment terms)
- [ ] Add Privacy Policy (Stripe data handling)
- [ ] Add Refund Policy
- [ ] Comply with PCI DSS (Stripe handles, but verify)
- [ ] Enable Strong Customer Authentication (SCA) for EU

### 6. App Store Requirements

- [ ] iOS: Configure Apple Pay
  - Add merchant ID to app.json
  - Enable Apple Pay in Xcode
  - Test with Apple Pay sandbox
- [ ] Android: Configure Google Pay
  - Already enabled in app.json
  - Test with Google Pay test cards
- [ ] Update app store descriptions (mention payment methods)

### 7. Payout Configuration

- [ ] Configure payout schedule (default: 2-day rolling)
- [ ] Or set manual payouts for better control
- [ ] Test chef payout flow
- [ ] Document payout timeline for chefs
- [ ] Add payout status to chef dashboard

### 8. Customer Support Preparation

- [ ] Document common payment issues
- [ ] Create Stripe Dashboard access for support team
- [ ] Set up refund process workflow
- [ ] Create FAQ for payment errors
- [ ] Train support on Stripe Dashboard

### 9. Security Hardening

- [ ] Verify webhook signature verification is working
- [ ] Ensure API keys are in environment variables (not code)
- [ ] Enable HTTPS on all endpoints
- [ ] Add rate limiting to payment endpoints
- [ ] Log all payment attempts (for fraud analysis)

### 10. Performance Testing

- [ ] Load test payment endpoint (100+ concurrent)
- [ ] Test webhook handling under load
- [ ] Verify database indexes on payment tables
- [ ] Test ephemeral key generation performance
- [ ] Monitor API response times

---

## Success Metrics

After deployment, track these metrics:

### Payment Success Rate
- Target: >95%
- Monitor: Stripe Dashboard → Analytics
- Alert if: <90% for 1 hour

### Webhook Reliability
- Target: 100% delivery
- Monitor: Stripe Dashboard → Developers → Webhooks
- Alert if: Any webhook fails 3+ times

### Average Payment Time
- Target: <5 seconds
- Monitor: API logs + Stripe
- Alert if: >10 seconds average

### Chef Onboarding Completion
- Target: >80% complete onboarding
- Monitor: Database query
- Improve: Send reminder emails

### Failed Payment Reasons
- Monitor: Stripe Dashboard → Failed payments
- Analyze: Top decline reasons
- Action: Improve error messages

---

## Support & Resources

### Stripe Documentation
- Payment Intents: https://stripe.com/docs/payments/payment-intents
- Payment Sheet (React Native): https://stripe.com/docs/payments/accept-a-payment-react-native
- Stripe Connect: https://stripe.com/docs/connect
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

### Internal Documentation
- API Specs: `05_api_endpoint_specs.md`
- Backend Architecture: `09_backend_architecture.md`
- Customer App Plan: `10_customer_app_plan.md`
- Implementation Summary: `/tmp/stripe_integration_summary.md`

### Get Help
- Stripe Support: https://support.stripe.com
- Stripe Status: https://status.stripe.com
- Community: https://github.com/stripe

---

## Appendix: Commands Reference

### Start All Services

```bash
# Terminal 1: Database
cd /home/nygmaee/Desktop/rideendine
npm run db:up

# Terminal 2: API
cd services/api
npm run start:dev

# Terminal 3: Chef Dashboard
cd apps/chef-dashboard
npm run dev

# Terminal 4: Mobile App
cd apps/customer-mobile
npx expo start --clear
```

### Stop All Services

```bash
# Stop API: Ctrl+C in Terminal 2
# Stop Dashboard: Ctrl+C in Terminal 3
# Stop Mobile: Ctrl+C in Terminal 4

# Stop database
cd /home/nygmaee/Desktop/rideendine
npm run db:down
```

### Database Queries

```bash
# Connect to database
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev

# Check recent orders
SELECT order_number, status, total_cents, created_at 
FROM orders ORDER BY created_at DESC LIMIT 5;

# Check payments
SELECT order_id, amount_cents, status, stripe_payment_intent_id 
FROM payments ORDER BY created_at DESC LIMIT 5;

# Check chef earnings
SELECT chef_id, amount_cents, type, status 
FROM chef_ledger ORDER BY created_at DESC LIMIT 5;

# Check chefs
SELECT business_name, stripe_account_id, stripe_charges_enabled 
FROM chefs;

# Check customers
SELECT email, stripe_customer_id 
FROM users WHERE stripe_customer_id IS NOT NULL;
```

### Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe
# or
sudo snap install stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to localhost:9001/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
stripe trigger account.updated
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-31  
**Status:** Ready for Testing ✅
