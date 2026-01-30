# Database Schema (Chefs, Orders, Payments, Payouts)

## Core Tables

### Chefs
```sql
CREATE TABLE chefs (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMP
);
```

### Customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP
);
```

### Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  chef_id UUID REFERENCES chefs(id),
  total_amount_cents INT,
  platform_fee_cents INT,
  chef_earning_cents INT,
  status TEXT,
  created_at TIMESTAMP
);
```

### Payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id TEXT,
  amount_cents INT,
  status TEXT,
  created_at TIMESTAMP
);
```

### Chef Ledger
```sql
CREATE TABLE chef_ledger (
  id UUID PRIMARY KEY,
  chef_id UUID REFERENCES chefs(id),
  order_id UUID REFERENCES orders(id),
  earning_cents INT,
  available_for_payout BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

### Payouts
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  chef_id UUID REFERENCES chefs(id),
  total_paid_cents INT,
  stripe_payout_id TEXT,
  payout_date DATE,
  status TEXT,
  created_at TIMESTAMP
);
```
