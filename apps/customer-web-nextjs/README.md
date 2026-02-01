# RideNDine Customer Web App (Next.js)

Modern Next.js 15 web application for customers to browse home chefs, order meals, and track deliveries in real-time.

## Status

**Version:** 1.0.0 (Week 2 - Day 1)
**Completion:** ~60%
**Dev Server:** http://localhost:3003

## Features

### ✅ Complete
- User authentication (login/signup)
- Chef discovery with search and filters
- Chef detail pages with menu
- Shopping cart with quantity management
- Responsive design (mobile/tablet/desktop)
- Real-time API integration
- TypeScript strict mode
- TailwindCSS styling

### 🚧 In Progress
- Checkout with Stripe Payment
- Order tracking with live map
- My Orders list
- User profile management

### 📋 Planned
- Saved addresses
- Payment methods
- Order reviews
- Push notifications

## Tech Stack

- **Framework:** Next.js 15.5.11 (App Router)
- **Language:** TypeScript 5.6
- **Styling:** TailwindCSS 3.4
- **State Management:** Zustand 4.5
- **Server State:** TanStack Query (React Query) 5.62
- **Real-time:** Socket.IO Client 4.8
- **Payments:** Stripe React 3.1
- **Maps:** Leaflet 1.9
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ (React 19 requires modern Node)
- npm 9+
- Backend API running on http://localhost:9001
- WebSocket service on ws://localhost:9004

### Installation

```bash
cd apps/customer-web-nextjs
npm install
```

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_WS_URL=ws://localhost:9004
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Development

```bash
npm run dev
```

Visit http://localhost:3003 (or the port shown in terminal)

### Build

```bash
npm run build
npm run start
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

## Project Structure

```
apps/customer-web-nextjs/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login, signup)
│   ├── (protected)/         # Protected routes (home, chefs, cart, etc.)
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/              # React components
│   ├── Header.tsx
│   └── ProtectedRoute.tsx
├── services/               # API and WebSocket services
│   ├── api.ts             # REST API client (42+ endpoints)
│   └── websocket.ts       # Socket.IO client
├── stores/                # Zustand state management
│   ├── auth.ts           # Auth state (user, tokens)
│   ├── cart.ts           # Shopping cart state
│   └── order.ts          # Order tracking state
├── types/                # TypeScript type definitions
│   └── index.ts          # All domain types
├── public/               # Static assets
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Redirects to /login or /home |
| `/login` | ✅ | User login |
| `/signup` | ✅ | User registration |
| `/home` | ✅ | Chef discovery with search/filters |
| `/chefs/[id]` | ✅ | Chef detail with menu |
| `/cart` | ✅ | Shopping cart |
| `/checkout` | 🚧 | Checkout with Stripe |
| `/orders` | 🚧 | Order history |
| `/orders/[id]` | 🚧 | Order tracking (real-time) |
| `/profile` | 🚧 | User profile |
| `/profile/addresses` | 📋 | Saved addresses |
| `/profile/payment-methods` | 📋 | Saved cards |

## API Integration

All API calls go through `services/api.ts`:

### Auth
- `login(email, password)` - Returns user + tokens
- `register(data)` - Creates customer account
- `refreshToken(token)` - Refreshes access token

### Chefs
- `searchChefs(params)` - Search nearby chefs
- `getChef(id)` - Get chef details
- `getChefMenus(chefId)` - Get chef's menus
- `getChefReviews(chefId)` - Get chef reviews

### Orders
- `createOrder(data)` - Create new order
- `getOrders(params?)` - Get order history
- `getOrder(id)` - Get order details
- `cancelOrder(id, reason?)` - Cancel order
- `getOrderEta(id)` - Get ETA

### Payments
- `createPaymentIntent(orderId)` - Stripe payment intent
- `getEphemeralKey()` - Stripe ephemeral key

### Reviews
- `createReview(data)` - Submit review

## State Management

### Auth Store (`stores/auth.ts`)
- `user` - Current user object
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `isAuthenticated` - Boolean
- `setAuth(user, accessToken, refreshToken)` - Save auth
- `clearAuth()` - Logout
- `updateUser(data)` - Update user data

### Cart Store (`stores/cart.ts`)
- `items` - Cart items array
- `chef` - Selected chef (cart locked to one chef)
- `addItem(menuItem, chef, quantity)` - Add to cart
- `removeItem(menuItemId)` - Remove from cart
- `updateQuantity(menuItemId, quantity)` - Update quantity
- `clearCart()` - Empty cart
- `getTotalItems()` - Get item count
- `getSubtotal()` - Calculate subtotal

### Order Store (`stores/order.ts`)
- `currentOrder` - Active order
- `driverLocation` - Driver GPS coordinates
- `setCurrentOrder(order)` - Set order
- `updateCurrentOrder(data)` - Update order
- `setDriverLocation(location)` - Update driver location

## WebSocket Events

### Subscribe to events:
```typescript
import { wsService } from '@/services/websocket';

// Connect
wsService.connect(accessToken);

// Order status changed
wsService.onOrderStatusChanged((order) => {
  console.log('Order status:', order.status);
});

// Driver location updated
wsService.onDriverLocationUpdated((location) => {
  console.log('Driver at:', location.lat, location.lng);
});

// Join order room
wsService.joinOrderRoom(orderId);
```

## Styling

Uses TailwindCSS with custom theme:

### Colors
- **Primary:** Orange (`#f97316`)
- **Background:** Light gray (`#f9fafb`)
- **Text:** Dark gray (`#111827`)

### Breakpoints
- **sm:** 640px (mobile)
- **md:** 768px (tablet)
- **lg:** 1024px (desktop)
- **xl:** 1280px (large desktop)

## Testing

### Manual Testing Checklist
- [ ] Signup creates account
- [ ] Login authenticates user
- [ ] Search finds chefs
- [ ] Filters work (cuisine, sort)
- [ ] Chef page loads menu
- [ ] Add to cart works
- [ ] Cart updates quantities
- [ ] Checkout processes payment
- [ ] Order tracking shows status
- [ ] Real-time updates work
- [ ] Logout clears session

### E2E Testing (Planned)
- Playwright tests for user journeys
- Integration with Agent 3 test suite

## Troubleshooting

### Port 3000 in use
Next.js will auto-select another port (e.g., 3003). Check terminal output.

### File watcher limit
```bash
sudo sysctl -w fs.inotify.max_user_watches=524288
```

### TypeScript errors
```bash
npm run typecheck
```

### API connection errors
Verify backend is running on http://localhost:9001

### WebSocket connection fails
Verify realtime service is running on ws://localhost:9004

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- First Contentful Paint: < 1.5s (target)
- Largest Contentful Paint: < 2.5s (target)
- Time to Interactive: < 3.5s (target)

## Accessibility

- WCAG 2.1 AA compliance (in progress)
- Keyboard navigation support
- Screen reader compatible
- Color contrast > 4.5:1

## Contributing

See main repo DEVELOPMENT.md for guidelines.

## License

Proprietary - RideNDine Platform

---

**Built with:** ❤️ by Agent 2 (Frontend Applications Developer)
**Last Updated:** 2026-01-31
