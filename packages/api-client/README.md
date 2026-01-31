# API Client SDK (Scaffold)

**Status:** Documentation + minimal stub (not wired into apps yet).

## Purpose
This package is intended to be the shared SDK that all RideNDine frontends (customer web/react/mobile/dispatch/admin) can import to stay aligned on auth, orders, and realtime helpers. Right now it only exposes a tiny placeholder built around `fetch`.

## Current shape
- `index.js` exports `createClient(baseUrl)` that returns an object with `loginCustomer(orderId)`.  
- The implementation simply POSTS to `/api/auth/login` so the stub can be used in demos without copying fetch logic everywhere.

## Example usage

```js
const { createClient } = require("@ridendine/api-client");
const client = createClient("http://localhost:8081");
await client.loginCustomer("order-123");
```

Because the SDK currently has no bundler or TypeScript support, it is best used in Node scripts or as inspiration for a richer implementation.

## Next steps
1. Add typed DTOs (TypeScript interfaces) for each endpoint.  
2. Build fetch wrappers + WebSocket helpers that support token refresh.  
3. Publish to `packages/api-client` (npm workspace) so each app can import `@ridendine/api-client`.  
4. Document the shape of `/api/orders`, `/api/dispatch`, and `/realtime` responses so downstream apps can rely on stable types.
