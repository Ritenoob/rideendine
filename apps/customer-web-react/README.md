# Customer Web (React Prototype)

**Status:** Working prototype (points to the core demo server).

## Overview
This React tracker (`apps/customer-web-react/app.js`) renders the live driver map, ETA, and status timeline by polling the core server’s REST endpoints and listening to the `/api/dispatch` state. It is the go-to page for customer-focused demos once the legacy static tracker is retired.

## Running

```bash
python3 -m http.server 8010 --directory apps/customer-web-react
```

Then visit `http://localhost:8010`. In the UI:
- Server URL: enter `http://localhost:8081` (core demo server).  
- Order ID: choose one from the dispatch dropdown to begin tracking.

## Features
- Leaflet map with moving drivers and ETA circles.  
- Status timeline showing `dispatched`, `picked up`, `delivered`, etc.  
- Periodic polling of the core demo to refresh ETA + statuses every few seconds.  
- Reconnect logic to handle temporary network hiccups.

## Configuration
- The tracker assumes the core demo exposes `/api/dispatch` and `/api/orders/:id`.  
- You can change the port by passing `?server=http://<host>:<port>` in the query string for manual testing.

## Troubleshooting
- **Blank map**: confirm the core demo server is running on port 8081 and returning drivers.  
- **Order not found**: make sure you copied the Order ID from the dispatch UI after running “Live Dispatch.”  
- **Polling errors**: inspect browser devtools to see HTTP status (401 if auth tokens missing). The tracker relies on the same auth token the dispatch UI generates.

## Next steps
- Hook this UI into the future `services/api` once auth + order endpoints stabilize.  
- Add real WebSocket support so the map does not rely solely on polling.  
- Share components with the Expo mobile app for consistent styling.
