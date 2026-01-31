# Admin Web (Prototype)

**Status:** Next.js prototype (Phase 4 admin tooling).

## Overview
This admin panel is built with Next.js + Tailwind and mimics a production control center for RideNDine. It calls the API service on port 9001 to:

- Authenticate admin users (`/auth/login`).
- Surface dashboard stats, activity, and live user lists.
- Approve/reject chefs and drivers.
- View orders, refunds, reviews, and payouts.
- Read/write platform-wide settings (hovering on `SettingsPage` in `apps/admin-web/src/app/...`).

It leverages `apps/admin-web/src/lib/api.ts` for all REST interactions so you can reuse those helpers elsewhere.

## Running

```bash
cd apps/admin-web
npm install     # first time only
npm run dev     # Next.js dev server on port 3002
```

Alternatively, run `npm run build` + `npm run start` for a production build. You can still serve the `out/` directory via `python3 -m http.server 3002 --directory apps/admin-web/out` if you prefer static hosting after `next export`.

## Configuration
- `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:9001`) — the admin UI calls this base URL for all REST actions.  
- `NODE_ENV=production` will disable dev overlays and enable optimized builds (standard Next.js behavior).

## Key flows
- **Login** — posts to `/auth/login` and stores the JWT in `lib/api.ts`.
- **Dashboard** — `getDashboardStats`, `getRecentActivity`; renders metrics, charts (`recharts`), and statuses.
- **Users/Chefs/Drivers/Orders** — search/filter UI powered by `lib/api` helpers (`/admin/users`, `/admin/chefs`, etc.).
- **Settings** — the `SettingsPage` component edits commission, delivery, order, driver, and platform-status toggles and PATCHes `/admin/settings`.

## Notes
- The API service is still a stub; many endpoints return placeholders. Pair this UI with the real API once authorization/data is available.  
- `python3 -m http.server 3002 --directory apps/admin-web` still works if you prefer not to run Next.js, but you will lose server-side routing (the app is mostly client-side).  
- Keep the README in sync with `AGENTS.md` (ports, prototype status) and with the root `README` to orient operators.

## Next steps
- Add actual API responses for `/admin/*` endpoints.  
- Introduce caching (e.g., SWR) for dashboards and listings.  
- Expand the settings page into multi-tab forms for config, compliance, and payouts.
