# RideNDine Legacy Demo Archive

This directory packages a self-contained snapshot of the earliest RideNDine experience. The HTML, assets, and accompanying `server.js` are meant for quick playback of the original Hamilton (Eastgate Square) demo without any modern service dependencies.

## What's inside
- `index.html` — standalone UI that animates driver routes over a pre-recorded data set.  
- `server.js` — minimal Node script that logs to the console (kept for parity with the original deploy package but no longer required).  
- Static assets (SVGs, map tiles, etc.) that power the legacy visualization.

## Running the archive today
1. Start a file server from this directory so the browser can load local assets without CORS issues:

   ```bash
   cd ridendine_demo
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000/index.html` in your browser. The script fetches the bundled mock data and replays the demo automatically.

3. Optional: run `node server.js` in another shell if you want to observe the very small “backend log” that mirrors the original deployment, but the page works without it.

## Notes
- This archive is **not** wired to the modern core demo (ports 8081/9001). Use it purely for offline visualization or to capture the early design intent.  
- All realtime positioning and routing are pre-baked; no live WebSocket or API calls are made.  
- For current development, prefer `ridendine_v2_live_routing/` (see its README) because it reproduces the full routing/dispatch/customer stack.

## Next upgrades
- Replace the mocked paths with real routing responses from `services/routing/`.  
- Migrate the UI to reuse `apps/customer-web-react/` components so both experiences share code.  
- Archive this folder as a reference snapshot before any future redesigns so the original behavior stays accessible.
