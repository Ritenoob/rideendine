# Stripe Connect Architecture (Marketplace Payment System)

> **Status:** ⚠️ PLANNED — This document describes intended architecture. Not yet implemented.

## Goal
Implement a marketplace payments flow where:

- Customers pay the platform  
- Platform holds funds until delivery completion  
- Revenue is split between chef + app  
- Chefs are paid daily via batch payouts  

## Recommended Stripe Product
### Stripe Connect (Express Accounts)

This is the correct solution for multi-vendor payouts.

---

## Payment Flow Architecture

### Step 1 — Customer Checkout
Customer pays through platform checkout:

Customer → Stripe Checkout → Platform Balance

---

### Step 2 — Platform as Merchant of Record
Platform controls full charge, refunds, disputes, and settlement timing.

---

### Step 3 — Split Payments with Transfer
After delivery:

- Platform calculates chef share
- Transfers chef portion

---

### Step 4 — Daily Batch Payout Execution
Daily cron job aggregates chef balances and sends payouts.

---

## Key Stripe Objects
- PaymentIntent
- Transfer
- Payout

---

## Benefits
✅ Compliant marketplace structure  
✅ Platform controls payment timing  
✅ Supports multi-chef scaling  
✅ Automated daily settlement  
