# Customer Mobile (Expo)

**Status:** Working prototype (React Native / Expo).

## Overview
This mobile tracker is built with Expo, React Navigation, and React Native Maps. It consumes the core demo server (port 8081) for auth, orders, and live location updates. Deep linking (`ridendine://track?orderId=...`) allows other demos or carriers to jump straight into an order tracking screen.

## Running locally

```bash
cd apps/customer-mobile
npm install
npx expo start
```

- Scan the QR code with Expo Go (Android/iOS) or launch an emulator (`expo start --android` / `expo start --ios`).  
- Ensure your phone can reach the server URL you enter (`http://<your-machine-ip>:8081`). Use `hostname -I | awk '{print $1}'` to get the correct LAN IP.

## Configuration
- `EXPO_PUBLIC_API_URL` controls the API base (default `http://localhost:8081`).  
- The embedded `app.json` registers the URI scheme `ridendine` so `ridendine://track?orderId=...` opens the tracker directly.  
- Location permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) are required and declared for Android/iOS.

## Features
- Expo + React Navigation manage onboarding, order lists, and tracking flows (`src/navigation`).  
- Tracks driver position and ETA using live updates via `fetch` + WebSocket/long-polling (the `Services/api.ts` file shows all endpoints).  
- Deep links can prefill the Order ID field so you can test share flows or invoke from other apps.  
- Authentication refresh logic is built in; the store clears tokens on 401 responses.

## Troubleshooting
- **Can't reach API**: Expo defaults to `localhost`, but your device needs a LAN IP. Override `EXPO_PUBLIC_API_URL` or enter the IP in the UI.  
- **Location permission denied**: Expo prompts once—allow it to track your position. If denied, reinstall the app or reset permissions.  
- **WebSocket disconnects**: Confirm the core server runs on 8081 and the token is being passed in `ridendine://track?orderId=...`.

## Notes
- This app is marked as a prototype; it demonstrates future driver-customer alignment but lacks production polish (error handling, accessibility, etc.).  
- It relies on `apps/customer-web-react` for UI components where possible; reuse shared logic for consistent UX.  
- Archiving or refactoring this project should reference `apps/customer-mobile/src` for state management, navigation, and `services/api` helpers.
