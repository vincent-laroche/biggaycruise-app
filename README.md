# Big Gay Cruise Guest App

Native iOS and Android guest companion for Big Gay Cruise. The application will provide authenticated cruise context, pass validation QR, pre-cruise/onboard reminders, event guidance, next-cruise prompts, and sharing tools while BGC’s public site remains the marketing and checkout surface.

## Current scope

The repository is being initialized from the approved product plan. The first implementation milestone establishes the Expo mobile shell, the Cloudflare API boundary, the app domain contracts, and the Phase 1 guest/staff flows. Booking, pass, and paid-status data will remain unavailable until BGC confirms the authoritative source and field mapping.

## Architecture

- `mobile/`: Expo / React Native iOS and Android application.
- `worker/`: Cloudflare Worker API boundary for authorization, dynamic QR validation, and later integration adapters.
- `docs/`: Product and integration implementation documents.

## Security baseline

Never store payment-card information in this repository. QR credentials must be short-lived and verified by the server. Keep external credentials in environment-specific secret stores only.
