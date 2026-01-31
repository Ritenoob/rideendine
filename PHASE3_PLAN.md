# Phase 3: Frontend Development - Complete Plan

## Status: READY TO START

**Approach:** Worked backwards from production state  
**Duration:** 4 weeks (16 days, ~56-64 hours)  
**Current Position:** Week 7 Day 1

---

## 🎯 Production End State

By end of Week 10, achieve:
- ✅ Customer can discover chefs → browse menus → place order → track delivery
- ✅ Chef can receive orders → manage menu → mark ready → view earnings
- ✅ Driver can go online → accept orders → navigate → mark delivered
- ✅ All apps connected to live API with real-time updates

---

## 📊 Current State Analysis

### Backend (Phase 2) ✅ COMPLETE
```
✅ 42 REST endpoints operational
✅ WebSocket gateway (Socket.IO) running
✅ Full order lifecycle (pending → delivered)
✅ Driver dispatch with GPS tracking
✅ Stripe Connect payment processing
✅ Real-time tracking endpoint
✅ Database with 5 migrations applied
```

### Frontend Apps 🔄 IN PROGRESS

#### Customer Mobile: 25% Complete
```
✅ TypeScript + Zustand + React Navigation structure
✅ API client (240 lines) covering all endpoints
✅ Auth store with SecureStore persistence
✅ Stripe SDK (@stripe/stripe-react-native) installed
✅ React Native Maps configured
✅ Basic UI components (Card, Button, Input)
✅ Scaffolded screens (HomeScreen, ChefCard, MenuItemCard)

❌ Navigation flow incomplete
❌ Screens need implementation (7 screens)
❌ Cart state management missing
❌ Stripe Payment Sheet not integrated
❌ Location permissions not configured
❌ Push notifications not set up
```

#### Chef Dashboard: 5% Complete
```
✅ HTML prototype exists (apps/admin-web/)
❌ Next.js project not created
❌ No API integration
❌ No real-time WebSocket
```

#### Driver Mobile: 0% Complete
```
❌ Not started (will copy customer-mobile structure)
```

#### Admin Panel: 5% Complete (Deferred to Phase 4)
```
✅ HTML prototype exists
❌ React/Next.js conversion needed
```

---

## �� Week-by-Week Plan (Working Backwards)

### Week 10 Goal: Driver App + Full Integration ✅
**Enables:** Complete order fulfillment cycle

**Dependencies:** Week 9 chef dashboard working

**Deliverables:**
- Driver mobile app with 5 screens
- GPS background tracking
- Assignment accept/decline flow
- Turn-by-turn navigation
- Photo upload (pickup/delivery proof)
- End-to-end order test passing

---

### Week 9 Goal: Chef Dashboard ✅
**Enables:** Chef can manage all operations via web

**Dependencies:** Week 8 validated API endpoints

**Deliverables:**
- Next.js 14 project with App Router
- Order management interface
- Menu CRUD with image upload
- Real-time WebSocket notifications
- Operating hours configuration
- Earnings dashboard

---

### Week 8 Goal: Customer Ordering & Payment ✅
**Enables:** Customer can complete purchase

**Dependencies:** Week 7 discovery flow working

**Deliverables:**
- Menu browsing screen
- Cart with item management
- Checkout flow
- Stripe Payment Sheet integration
- Order confirmation
- Order history screen
- Profile/settings screen

---

### Week 7 Goal: Customer Discovery ✅
**Enables:** Customer can find chefs and view menus

**Dependencies:** Backend Phase 2 complete (✅)

**Deliverables:**
- React Navigation setup (stacks + tabs)
- Location permissions configured
- HomeScreen with chef discovery
- Chef profile screen
- Menu preview
- Chef reviews display

---

## 🗓️ Day-by-Day Breakdown

### Week 7: Customer Discovery (Days 1-3)

#### Day 1: Foundation
**Duration:** 6-8 hours

**Tasks:**
1. Test API client against live backend
   - Start API server: `cd services/api && npm run start:dev`
   - Test auth: Register → login → store token
   - Verify SecureStore persistence
   
2. Setup React Navigation
   - Create AuthStack (Login, Register)
   - Create MainStack (Home, ChefProfile, Menu, etc.)
   - Create TabNavigator (Home, Orders, Profile)
   - Configure navigation container

3. Location Permissions
   - Add location permissions to app.json:
     ```json
     {
       "ios": {
         "infoPlist": {
           "NSLocationWhenInUseUsageDescription": "We need your location to find chefs near you"
         }
       },
       "android": {
         "permissions": ["ACCESS_FINE_LOCATION"]
       }
     }
     ```
   - Implement location request flow
   - Test on physical device

4. HomeScreen v1
   - Fetch user location on mount
   - Call `api.searchChefs({ lat, lng, radius: 10 })`
   - Display list of ChefCards
   - Add pull-to-refresh

**Success Criteria:**
- [ ] App navigates between auth and main screens
- [ ] Location permission prompt appears
- [ ] HomeScreen shows chef list from API
- [ ] Pull to refresh reloads chef list

**Files to Create:**
```
src/navigation/
  AuthNavigator.tsx
  MainNavigator.tsx
  TabNavigator.tsx
  index.tsx

src/screens/auth/
  LoginScreen.tsx
  RegisterScreen.tsx

src/screens/home/
  HomeScreen.tsx (update existing)

src/hooks/
  useLocation.ts
```

---

#### Day 2: Chef Discovery UI
**Duration:** 6-8 hours

**Tasks:**
1. Enhance ChefCard component
   - Add placeholder image or API image URL
   - Display: business name, cuisine types, rating, distance
   - Add prep time estimate
   - onPress navigates to ChefProfile

2. Search & Filter UI
   - Add SearchBar component at top
   - Add filter chips (cuisine type, rating, distance)
   - Implement filter logic
   - Debounce search input

3. Loading States
   - Show skeleton loaders while fetching
   - Display empty state ("No chefs found nearby")
   - Handle error state with retry button

4. Polish
   - Add animations (fade in)
   - Optimize FlatList (virtualization)
   - Add refresh indicator

**Success Criteria:**
- [ ] Chef cards display properly
- [ ] Search filters work
- [ ] Loading states look good
- [ ] Can tap chef card to navigate

**Files to Create/Update:**
```
src/components/chef/
  ChefCard.tsx (update)
  ChefFilters.tsx (new)

src/components/ui/
  SearchBar.tsx
  SkeletonLoader.tsx
  EmptyState.tsx

src/screens/home/
  HomeScreen.tsx (enhance)
```

---

#### Day 3: Chef Profile & Menu Preview
**Duration:** 6-8 hours

**Tasks:**
1. ChefProfileScreen layout
   - Hero section with chef image
   - Business info (name, address, hours)
   - Stats (rating, deliveries, prep time)
   - Tabs: Menu, Reviews, Info

2. Menu Preview
   - Fetch `api.getChefMenus(chefId)`
   - Display menu categories
   - Show menu items with MenuItemCard
   - onPress item shows detail modal

3. Reviews Section
   - Fetch `api.getChefReviews(chefId)`
   - Display review cards
   - Show rating distribution

4. Favorite Feature
   - Add favorite button (heart icon)
   - Store favorites in local storage
   - Display favorited chefs on profile tab

**Success Criteria:**
- [ ] Chef profile shows complete info
- [ ] Menu items display correctly
- [ ] Reviews load and display
- [ ] Can favorite/unfavorite chefs

**Files to Create:**
```
src/screens/chef/
  ChefProfileScreen.tsx
  ChefReviewsTab.tsx
  ChefMenuTab.tsx
  ChefInfoTab.tsx

src/components/chef/
  MenuItemCard.tsx (update)
  ReviewCard.tsx

src/components/ui/
  TabView.tsx
```

**Week 7 Checkpoint:**
- Can browse 5+ chefs in area
- Chef profile shows menu
- Navigation works smoothly

---

### Week 8: Ordering & Payment (Days 4-7)

#### Day 4: Menu & Cart Foundation
**Duration:** 6-8 hours

**Tasks:**
1. MenuScreen with categories
   - Fetch full menu for chef
   - Group by categories
   - Sticky category headers
   - Search within menu

2. Menu item detail modal
   - Show item photo, name, description
   - Display price, prep time
   - Add quantity selector
   - Special instructions input
   - Add to cart button

3. Cart store (Zustand)
   ```typescript
   interface CartItem {
     menuItemId: string;
     name: string;
     price: number;
     quantity: number;
     specialInstructions?: string;
     chefId: string;
   }

   interface CartStore {
     items: CartItem[];
     chefId: string | null;
     addItem: (item: CartItem) => void;
     removeItem: (menuItemId: string) => void;
     updateQuantity: (menuItemId: string, quantity: number) => void;
     clearCart: () => void;
     getTotal: () => number;
   }
   ```

4. Add to cart functionality
   - Validate same chef constraint
   - Update cart badge count
   - Show cart icon in header
   - Add success toast

**Success Criteria:**
- [ ] Can browse full menu
- [ ] Item detail modal works
- [ ] Items added to cart
- [ ] Cart badge shows count

**Files to Create:**
```
src/screens/menu/
  MenuScreen.tsx
  MenuItemDetailModal.tsx

src/store/
  cartStore.ts (update existing)

src/hooks/
  useCart.ts
```

---

#### Day 5: Cart & Checkout Prep
**Duration:** 6-8 hours

**Tasks:**
1. CartScreen layout
   - List cart items
   - Quantity +/- buttons
   - Remove item swipe action
   - Subtotal calculation
   - Tax + delivery fee display

2. Delivery address input
   - Use expo-location to get current
   - Allow manual address entry
   - Autocomplete with Google Places API (optional)
   - Save address to profile

3. Tip selection
   - Preset tip amounts (15%, 18%, 20%, custom)
   - Show final total with tip

4. Promo code input
   - Input field for promo code
   - Validate with API (future endpoint)
   - Display discount amount

5. Checkout button
   - Validate cart not empty
   - Validate delivery address
   - Navigate to checkout

**Success Criteria:**
- [ ] Cart displays all items
- [ ] Can adjust quantities
- [ ] Total calculates correctly
- [ ] Can proceed to checkout

**Files to Create:**
```
src/screens/cart/
  CartScreen.tsx
  AddressInputModal.tsx
  TipSelector.tsx

src/components/cart/
  CartItemCard.tsx
  CartSummary.tsx
```

---

#### Day 6: Stripe Payment Integration
**Duration:** 8-10 hours (complex)

**Tasks:**
1. Create order before payment
   - Call `api.createOrder(orderData)`
   - Receive orderId
   - Navigate to payment screen

2. Initialize Stripe Payment Sheet
   ```typescript
   const { error } = await initPaymentSheet({
     merchantDisplayName: 'RideNDine',
     customerId: user.stripeCustomerId,
     customerEphemeralKeySecret: ephemeralKey,
     paymentIntentClientSecret: clientSecret,
     allowsDelayedPaymentMethods: true,
     returnURL: 'ridendine://payment-success',
   });
   ```

3. Present Payment Sheet
   - Call `presentPaymentSheet()`
   - Handle success: navigate to order confirmation
   - Handle error: show error message

4. Order confirmation screen
   - Display order number
   - Show estimated delivery time
   - Link to order tracking
   - Option to view order details

5. Payment error handling
   - Retry payment
   - Contact support
   - Cancel order

**Success Criteria:**
- [ ] Payment Sheet presents correctly
- [ ] Payment succeeds
- [ ] Order confirmation shows
- [ ] Order appears in backend

**Files to Create:**
```
src/screens/checkout/
  CheckoutScreen.tsx
  PaymentScreen.tsx
  OrderConfirmationScreen.tsx

src/hooks/
  useStripePayment.ts

src/utils/
  payment.ts
```

**Configuration Required:**
```bash
# Add to app.json
"expo": {
  "plugins": [
    [
      "@stripe/stripe-react-native",
      {
        "merchantIdentifier": "merchant.com.ridendine",
        "enableGooglePay": true
      }
    ]
  ]
}
```

---

#### Day 7: Order History & Profile
**Duration:** 6-8 hours

**Tasks:**
1. OrderHistoryScreen
   - Fetch `api.getOrders({ status: 'all' })`
   - Display order cards
   - Group by status (active, past)
   - onPress navigates to order detail

2. OrderDetailScreen
   - Show order summary
   - Display items ordered
   - Show delivery status
   - Link to live tracking
   - Reorder button

3. ProfileScreen
   - Display user info
   - Saved addresses
   - Payment methods
   - Order history link
   - Settings button
   - Logout button

4. Push notification handlers
   - Request notification permissions
   - Register device token with backend
   - Handle notification tap
   - Deep link to order detail

**Success Criteria:**
- [ ] Order history displays
- [ ] Can view order details
- [ ] Profile shows user info
- [ ] Notifications work (basic)

**Files to Create:**
```
src/screens/orders/
  OrderHistoryScreen.tsx
  OrderDetailScreen.tsx

src/screens/profile/
  ProfileScreen.tsx
  SettingsScreen.tsx
  AddressesScreen.tsx

src/hooks/
  usePushNotifications.ts
```

**Week 8 Checkpoint:**
- Can place order with payment
- Order appears in backend
- Receive order confirmation

---

### Week 9: Chef Dashboard (Days 8-11)

#### Day 8: Next.js Foundation
**Duration:** 6-8 hours

**Tasks:**
1. Create Next.js project
   ```bash
   npx create-next-app@latest chef-dashboard --typescript --tailwind --app
   cd chef-dashboard
   npm install socket.io-client @tanstack/react-query zustand
   ```

2. Project structure
   ```
   src/
     app/
       (auth)/
         login/page.tsx
         register/page.tsx
       (dashboard)/
         layout.tsx
         page.tsx
         orders/page.tsx
         menu/page.tsx
         settings/page.tsx
     components/
     lib/
       api.ts
       socket.ts
     hooks/
     types/
   ```

3. Authentication flow
   - Login page with email/password
   - JWT token storage (http-only cookies)
   - Protected routes middleware
   - Redirect logic

4. API client setup
   - Create fetch wrapper with auth headers
   - Error handling
   - Token refresh logic

5. Socket.IO client
   - Connect to WebSocket gateway
   - Authenticate with JWT
   - Event listeners setup

**Success Criteria:**
- [ ] Can login as chef
- [ ] Protected routes work
- [ ] API calls authenticated
- [ ] WebSocket connects

**Files to Create:**
```
chef-dashboard/
  src/lib/api.ts
  src/lib/socket.ts
  src/app/(auth)/login/page.tsx
  src/app/(dashboard)/layout.tsx
  src/middleware.ts
```

---

#### Day 9: Dashboard Home & Navigation
**Duration:** 6-8 hours

**Tasks:**
1. Dashboard layout
   - Sidebar navigation
   - Header with user menu
   - Breadcrumbs
   - Mobile responsive

2. Dashboard home page
   - Stats cards (today's orders, revenue, ratings)
   - Recent orders list
   - Quick actions (mark ready, view menu)
   - Charts (optional)

3. Navigation links
   - Orders
   - Menu
   - Settings
   - Earnings
   - Logout

4. Styling
   - Tailwind CSS utilities
   - Or install Shadcn/UI components
   - Consistent color scheme
   - Loading skeletons

**Success Criteria:**
- [ ] Dashboard loads with stats
- [ ] Navigation works
- [ ] Layout is responsive
- [ ] Looks professional

**Files to Create:**
```
src/app/(dashboard)/
  page.tsx
  orders/page.tsx
  menu/page.tsx
  settings/page.tsx

src/components/
  Sidebar.tsx
  Header.tsx
  StatsCard.tsx
```

---

#### Day 10: Order Management
**Duration:** 6-8 hours

**Tasks:**
1. Order list view
   - Fetch orders for chef
   - Filter by status (pending, preparing, ready)
   - Sort by created date
   - Pagination

2. Order card component
   - Order number
   - Customer name
   - Items summary
   - Status badge
   - Time since created
   - Action buttons

3. Order detail modal/page
   - Full order details
   - Customer delivery address
   - Items with quantities
   - Special instructions
   - Timeline of status changes

4. Status change actions
   - Accept order button
   - Reject order button (with reason)
   - Mark ready button
   - Confirmation dialogs

5. WebSocket real-time updates
   - Listen for `order:new` event
   - Play notification sound
   - Update order list automatically
   - Show toast notification

**Success Criteria:**
- [ ] Orders display in real-time
- [ ] Can accept/reject orders
- [ ] Can mark order ready
- [ ] WebSocket updates work

**Files to Create:**
```
src/app/(dashboard)/orders/
  page.tsx
  [id]/page.tsx

src/components/orders/
  OrderCard.tsx
  OrderDetailModal.tsx
  OrderActions.tsx
  OrderTimeline.tsx

src/hooks/
  useOrders.ts
  useWebSocket.ts
```

---

#### Day 11: Menu Management
**Duration:** 6-8 hours

**Tasks:**
1. Menu list view
   - Display all menu items
   - Group by menu/category
   - Search/filter items
   - Toggle availability

2. Create menu item form
   - Item name, description
   - Price, prep time
   - Category dropdown
   - Availability toggle
   - Image upload

3. Edit menu item
   - Pre-fill form with existing data
   - Update item
   - Delete item (with confirmation)

4. Image upload
   - Use file input
   - Preview image before upload
   - Upload to backend endpoint
   - Display uploaded image

5. Operating hours config
   - Day-by-day schedule
   - Open/close times
   - Closed days
   - Save to backend

6. Settings page
   - Business info
   - Delivery radius
   - Minimum order amount
   - Notification preferences

**Success Criteria:**
- [ ] Can create menu item
- [ ] Can edit/delete items
- [ ] Image upload works
- [ ] Operating hours save

**Files to Create:**
```
src/app/(dashboard)/menu/
  page.tsx
  new/page.tsx
  [id]/edit/page.tsx

src/components/menu/
  MenuItemCard.tsx
  MenuItemForm.tsx
  ImageUpload.tsx
  OperatingHours.tsx

src/app/(dashboard)/settings/
  page.tsx
```

**Week 9 Checkpoint:**
- Chef can receive orders
- Chef can manage menu
- Real-time notifications work

---

### Week 10: Driver App & Final Integration (Days 12-14)

#### Day 12: Driver App Foundation
**Duration:** 8-10 hours

**Tasks:**
1. Copy customer-mobile structure
   ```bash
   cp -r apps/customer-mobile apps/driver-mobile
   cd apps/driver-mobile
   # Update app.json name, slug, package
   ```

2. Driver-specific authentication
   - Register as driver role
   - Driver profile setup
   - Vehicle info collection
   - Document uploads (placeholder)

3. Online/offline toggle
   - Prominent toggle in header
   - Call `api.updateAvailability({ isAvailable: true })`
   - Store online status locally
   - Background keepalive

4. Available orders screen
   - Fetch available orders near driver
   - Display order cards (chef location, items, pay)
   - Distance from driver to chef
   - Estimated pickup time

5. Assignment flow
   - Receive WebSocket `driver:new_assignment` event
   - Show modal with order details
   - Accept button → `api.acceptAssignment(assignmentId)`
   - Decline button → `api.declineAssignment(assignmentId, reason)`

6. Active delivery screen
   - Display current order details
   - Chef pickup address
   - Customer delivery address
   - Order items
   - Navigation buttons

**Success Criteria:**
- [ ] Driver can register
- [ ] Can toggle online/offline
- [ ] Sees available orders
- [ ] Can accept assignment

**Files to Create:**
```
src/screens/driver/
  OnlineToggleScreen.tsx
  AvailableOrdersScreen.tsx
  ActiveDeliveryScreen.tsx
  EarningsScreen.tsx

src/store/
  driverStore.ts

src/services/
  driverApi.ts
```

---

#### Day 13: Delivery Features
**Duration:** 8-10 hours

**Tasks:**
1. GPS background tracking
   - Configure background location task:
     ```typescript
     TaskManager.defineTask('LOCATION_TASK', async ({ data, error }) => {
       if (data) {
         const { locations } = data;
         // Send to API
         await api.updateLocation({
           latitude: locations[0].coords.latitude,
           longitude: locations[0].coords.longitude,
         });
       }
     });
     ```
   - Start task when order assigned
   - Send location every 10 seconds
   - Stop task when delivered

2. Turn-by-turn navigation
   - Button to open Google Maps/Apple Maps
   - Deep link with coordinates:
     ```typescript
     const url = Platform.select({
       ios: `maps:?daddr=${lat},${lng}`,
       android: `google.navigation:q=${lat},${lng}`,
     });
     Linking.openURL(url);
     ```

3. Delivery status updates
   - Mark picked up button
   - Mark in transit button
   - Mark delivered button
   - Call corresponding API endpoints

4. Photo upload
   - expo-camera for pickup/delivery proof
   - Take photo on pickup
   - Take photo on delivery
   - Upload to backend (requires multipart endpoint)

5. Earnings screen
   - Fetch driver stats
   - Display total earnings
   - Pending payouts
   - Delivery history

**Success Criteria:**
- [ ] GPS streams to backend
- [ ] Navigation opens
- [ ] Can mark statuses
- [ ] Photos upload (if endpoint exists)

**Files to Create:**
```
src/services/
  backgroundLocation.ts

src/screens/driver/
  NavigationScreen.tsx
  PhotoUploadScreen.tsx
  EarningsScreen.tsx

src/utils/
  navigation.ts
```

**Configuration Required:**
```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow RideNDine to use your location for deliveries."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["location"]
      }
    }
  }
}
```

---

#### Day 14: Final Integration & Testing
**Duration:** 6-8 hours

**Tasks:**
1. End-to-end order test
   - Customer: Browse → add to cart → checkout → pay
   - Chef: Receive notification → accept → mark ready
   - Driver: Receive assignment → accept → pickup → deliver
   - Customer: Track in real-time → receive notification

2. Push notifications
   - Expo push notifications setup
   - Register device tokens
   - Send notifications on:
     - Order created (chef)
     - Order assigned (driver)
     - Order picked up (customer)
     - Order delivered (customer)

3. Performance optimization
   - Image lazy loading
   - API response caching
   - Reduce unnecessary re-renders
   - Optimize FlatLists

4. Bug fixes
   - Test on iOS + Android
   - Fix navigation issues
   - Handle edge cases
   - Polish UI

5. Documentation
   - Update README files
   - Document environment variables
   - Create user guides
   - API integration examples

**Success Criteria:**
- [ ] Full order cycle works
- [ ] Push notifications send
- [ ] Apps perform smoothly
- [ ] No critical bugs

**Week 10 Checkpoint:**
- Driver completes delivery
- All apps connected
- Real-time tracking functional

---

## 📝 Technical Notes

### Environment Variables

**Customer/Driver Mobile:**
```bash
# .env
EXPO_PUBLIC_API_URL=http://<your-ip>:9001
EXPO_PUBLIC_WS_URL=ws://<your-ip>:9001/realtime
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Chef Dashboard:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_WS_URL=ws://localhost:9001/realtime
```

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### API Base URL
- **Development:** http://localhost:9001
- **Mobile Testing:** http://<LAN_IP>:9001
- **Production:** https://api.ridendine.com

### WebSocket Connection
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:9001/realtime', {
  auth: {
    token: accessToken,
  },
  transports: ['websocket'],
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.emit('subscribe:order', { orderId });
```

---

## 🎯 Success Metrics

### Week 7 Checkpoint
- [ ] Customer app shows 5+ chefs in area
- [ ] Chef profile displays menu items
- [ ] Navigation between screens works
- [ ] Location-based search functional

### Week 8 Checkpoint
- [ ] Customer can add items to cart
- [ ] Cart total calculates correctly
- [ ] Stripe payment completes
- [ ] Order appears in backend database

### Week 9 Checkpoint
- [ ] Chef receives new order notification
- [ ] Chef can mark order as ready
- [ ] Menu CRUD operations work
- [ ] Real-time updates display correctly

### Week 10 Checkpoint
- [ ] Driver receives assignment
- [ ] Driver GPS streams to customer
- [ ] Driver can mark order delivered
- [ ] Full order cycle from start to finish works

---

## 🚨 Known Risks & Mitigation

### Risk 1: Stripe Payment Integration
**Problem:** Payment Sheet can be complex  
**Mitigation:** Follow Stripe docs closely, test with test cards first  
**Fallback:** Use simple card input form if Payment Sheet fails

### Risk 2: Background GPS Tracking
**Problem:** iOS/Android permissions differ, battery drain  
**Mitigation:** Test on physical devices, optimize update frequency  
**Fallback:** Poll location less frequently (every 30s instead of 10s)

### Risk 3: Real-time WebSocket Reconnection
**Problem:** Connection drops, messages lost  
**Mitigation:** Implement exponential backoff, queue messages  
**Fallback:** Fall back to polling if WebSocket fails

### Risk 4: Image Upload
**Problem:** Backend multipart endpoint not implemented  
**Mitigation:** Create endpoint during Week 9/10  
**Fallback:** Use placeholder images temporarily

### Risk 5: Push Notifications
**Problem:** FCM configuration can be time-consuming  
**Mitigation:** Set up Firebase project early  
**Fallback:** Use in-app notifications only

---

## 📚 Resources

### Documentation
- React Navigation: https://reactnavigation.org/docs/getting-started
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/
- Stripe React Native: https://stripe.dev/stripe-react-native/
- Socket.IO Client: https://socket.io/docs/v4/client-api/
- Next.js App Router: https://nextjs.org/docs/app

### Tutorials
- Stripe Payment Sheet: https://stripe.com/docs/payments/accept-a-payment-react-native
- Background Location: https://docs.expo.dev/versions/latest/sdk/task-manager/
- Push Notifications: https://docs.expo.dev/push-notifications/overview/

---

## ✅ Phase 3 Completion Checklist

### Customer Mobile App
- [x] TypeScript + Zustand structure ✅
- [x] API client ✅
- [ ] 7 screens implemented
- [ ] Navigation flow complete
- [ ] Cart + checkout working
- [ ] Stripe payment integrated
- [ ] Order tracking functional
- [ ] Push notifications

### Chef Dashboard
- [ ] Next.js 14 project
- [ ] 5 pages implemented
- [ ] Order management UI
- [ ] Menu CRUD interface
- [ ] Real-time WebSocket notifications
- [ ] Image upload functionality

### Driver Mobile App
- [ ] React Native app created
- [ ] 5 screens implemented
- [ ] Assignment acceptance flow
- [ ] GPS background tracking
- [ ] Navigation integration
- [ ] Photo upload capability

---

**Current Status:** Ready to begin Week 7 Day 1  
**Next Action:** Test customer-mobile API client, setup navigation  
**Estimated Completion:** End of Week 10 (16 days)
