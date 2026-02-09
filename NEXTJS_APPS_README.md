# RideNDine Next.js Apps - Developer Guide

## Quick Start

All Next.js apps in the monorepo are now fully restructured with proper routing and authentication.

### Apps Overview

| App | Path | Auth | Port | Purpose |
|-----|------|------|------|---------|
| Customer Web | `apps/customer-web-nextjs` | Hybrid | 3000 | Public browsing + protected user area |
| Chef Dashboard | `apps/chef-dashboard` | Protected | 3001 | Chef management portal |
| Admin Web | `apps/admin-web` | Protected | 3002 | Admin control panel |

### Running the Apps

```bash
# Customer app
cd apps/customer-web-nextjs
npm install
npm run dev
# Open http://localhost:3000

# Chef dashboard
cd apps/chef-dashboard
npm install
npm run dev
# Open http://localhost:3001

# Admin web
cd apps/admin-web
npm install
npm run dev
# Open http://localhost:3002
```

## Customer App Routes

### Public Routes (No Auth Required)
- `/` - Landing page
- `/customer` - Browse chefs (renamed from /home)
- `/chefs` - Chef marketplace list
- `/chefs/[slug]` - Chef detail with menu
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/checkout/success` - Order confirmation
- `/checkout/cancel` - Checkout cancelled
- **`/order/[orderId]` - PUBLIC tracking (redacted data)**
- `/login` - User login
- `/signup` - User registration

### Protected Routes (Auth Required)
- `/profile` - User profile management
- `/orders` - Order history

### Key Features
- ✅ Public order tracking (privacy by design - redacted addresses)
- ✅ Cart persistence
- ✅ Chef search and filtering
- ✅ Custom 404 page
- ✅ Responsive design

## Chef Dashboard Routes

### All Protected (Chef-only Auth)
- `/login` - Chef login
- `/register` - Chef registration
- `/dashboard` - Overview
- `/dashboard/orders` - Active orders
- `/dashboard/menu` - Menu management
- `/dashboard/earnings` - Earnings/payouts
- `/dashboard/settings` - Profile/preferences

### Key Features
- ✅ Chef-specific authentication check
- ✅ Stripe integration ready
- ✅ Real-time order updates (pending)
- ✅ Menu CRUD operations (pending API)

## Admin Web Routes

### All Protected (Admin-only Auth)
- `/login` - Admin login
- `/dashboard` - Overview
- `/dashboard/users` - Customer management
- `/dashboard/chefs` - Chef management
- `/dashboard/drivers` - Driver management
- `/dashboard/orders` - All orders
- `/dashboard/payouts` - Payout management
- `/dashboard/disputes` - Dispute resolution
- `/dashboard/live-map` - Live delivery map
- `/dashboard/driver-simulator` - Testing tool
- `/dashboard/integrations` - Cooco/Mealbridge logs
- `/dashboard/reviews` - Reviews
- `/dashboard/settings` - Settings

### Public Routes
- `/legal/terms` - Terms of service
- `/legal/privacy` - Privacy policy

### Key Features
- ✅ Admin-specific authentication check
- ✅ Role-based access control ready
- ✅ Comprehensive dashboard
- ✅ Live map placeholder
- ✅ Driver simulator placeholder

## Authentication Flow

### Customer App
```typescript
// middleware.ts
- Public: /, /chefs, /order
- Protected: /profile, /orders
- Redirects: 
  - Auth users from /login → /customer
  - Non-auth users from protected → /login?redirect=...
```

### Chef Dashboard
```typescript
// middleware.ts
- Public: /login, /register
- Protected: All /dashboard routes
- Redirects:
  - Auth users from /login → /dashboard
  - Non-auth users from protected → /login?redirect=...
```

### Admin Web
```typescript
// middleware.ts
- Public: /login, /legal/*
- Protected: All /dashboard routes
- Redirects:
  - Auth users from /login → /dashboard
  - Non-auth users from protected → /login?redirect=...
```

## Privacy & Security

### Order Tracking (`/order/[orderId]`)
This route is intentionally **public** to allow:
- Gift recipients to track deliveries
- Customers to share tracking links
- No account required for basic tracking

**Redacted Data:**
- ❌ Chef exact addresses (only business name)
- ❌ Driver personal info (only status)
- ❌ Sensitive order details
- ✅ Order status timeline
- ✅ ETA
- ✅ Item count
- ✅ Total price

### Authentication Tokens
All apps use cookie-based auth:
```typescript
const token = request.cookies.get('auth-token')?.value;
```

For production, ensure:
1. JWT tokens with proper expiry
2. HttpOnly, Secure cookies
3. CSRF protection
4. Rate limiting on auth endpoints

## Next Steps

### 1. API Integration
Replace placeholder data with real API calls:

```typescript
// Example: apps/customer-web-nextjs/app/chefs/page.tsx
const { data: chefs } = useQuery({
  queryKey: ['chefs', location, cuisineFilter, sortBy],
  queryFn: () => api.searchChefs({
    lat: location.lat,
    lng: location.lng,
    radius: 25,
    cuisineType: cuisineFilter,
    sortBy,
  }),
});
```

### 2. Stripe Integration
Wire up checkout flow:

```typescript
// apps/customer-web-nextjs/app/checkout/page.tsx
// 1. Create PaymentIntent
// 2. Render Stripe Payment Element
// 3. Handle success/cancel callbacks
```

### 3. Real-Time Features
Add WebSocket connections:

```typescript
// apps/customer-web-nextjs/app/order/[orderId]/page.tsx
// Subscribe to order updates
// Update UI in real-time
```

### 4. Form Validation
Add client-side validation:

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

### 5. SEO & Metadata
Add proper metadata to all pages:

```typescript
export const metadata = {
  title: 'Browse Chefs | RideNDine',
  description: 'Discover talented home chefs in your area',
  openGraph: { ... },
};
```

## Troubleshooting

### Port Conflicts
```bash
# Find process on port
lsof -i :3000

# Kill process
kill $(lsof -t -i :3000)
```

### Build Errors
```bash
# Clean rebuild
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript Errors
```bash
# Check types without building
npx tsc --noEmit
```

### Middleware Not Working
1. Check middleware.ts is in root of app directory
2. Verify matcher patterns match your routes
3. Ensure cookies are being set properly

## File Structure Reference

### Customer App
```
apps/customer-web-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx (auth guard)
│   │   ├── cart/page.tsx
│   │   ├── profile/page.tsx
│   │   └── orders/page.tsx
│   ├── chefs/
│   │   ├── page.tsx (marketplace)
│   │   └── [slug]/page.tsx (chef detail)
│   ├── checkout/
│   │   ├── page.tsx
│   │   ├── success/page.tsx
│   │   └── cancel/page.tsx
│   ├── customer/page.tsx (browse home)
│   ├── order/[orderId]/page.tsx (PUBLIC tracking)
│   ├── page.tsx (landing)
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   └── ProtectedRoute.tsx
├── middleware.ts
└── package.json
```

### Chef Dashboard
```
apps/chef-dashboard/src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx (protected)
│   │   ├── page.tsx
│   │   ├── orders/page.tsx
│   │   ├── menu/page.tsx
│   │   ├── earnings/page.tsx
│   │   └── settings/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── middleware.ts
└── package.json
```

### Admin Web
```
apps/admin-web/src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx (uses DashboardLayout)
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── chefs/page.tsx
│   │   ├── drivers/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── payouts/page.tsx
│   │   ├── disputes/page.tsx
│   │   ├── live-map/page.tsx
│   │   ├── driver-simulator/page.tsx
│   │   ├── integrations/page.tsx
│   │   ├── reviews/page.tsx
│   │   └── settings/page.tsx
│   ├── legal/
│   │   ├── terms/page.tsx
│   │   └── privacy/page.tsx
│   ├── login/page.tsx
│   └── layout.tsx
├── components/
│   └── DashboardLayout.tsx
├── middleware.ts
└── package.json
```

## Related Documentation

- [NEXTJS_RESTRUCTURE_COMPLETE.md](./NEXTJS_RESTRUCTURE_COMPLETE.md) - Full restructuring details
- [README.md](./README.md) - Main project README
- [AGENTS.md](./AGENTS.md) - Agent roles and guidance

---

**Last Updated**: 2026-02-09  
**Status**: ✅ All routes working, authentication implemented  
**Ready For**: API integration, real-time features, production deployment
