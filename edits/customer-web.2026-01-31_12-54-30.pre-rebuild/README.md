# Customer Web (Legacy Static Tracker)

**Status:** Legacy static demo (read-only).

## Overview
This folder hosts the original HTML tracker that predates the React prototype. It animates driver movement and order status using pre-baked datasets, making it useful for communicating the concept without running the full React/Expo stack.

## Run

```bash
cd apps/customer-web
python3 -m http.server 8001
```

Then open `http://localhost:8001/index.html`.

## What to expect
- The page renders a Leaflet map of Hamilton (Eastgate Square) with 10 cooks, 200 orders, and 20 drivers.  
- It does not connect to `ridendine_v2_live_routing` or live WebSockets; positions and statuses replay from bundled JSON.  
- Use it for quick demo storytelling, screenshots, or as a reference while building the React tracker.

## Notes
- All live demos should still point to the React tracker (`apps/customer-web-react`) or the Expo app for real-time data.  
- Keep this folder intact as a historical artifact—the React version now contains the polished experience.
