# Big Gay Cruise App Instructions

- Build a shared native iOS and Android guest companion using Expo/React Native and TypeScript.
- Keep the public website as the marketing surface; the mobile app is the authenticated guest and onboard-operations experience.
- Do not hardcode secrets, payment-card data, or guest production data. Use environment variables and server-side integrations.
- Use the Cloudflare Worker layer for API boundaries, QR credential validation, webhook intake, and operational authorization.
- Preserve QR security: issue short-lived signed credentials; validate on the server; log scan results; never make static QR codes authoritative.
- Keep guest, staff scanner, and BGC operator permissions separate.
- Use real data only when BGC authorizes an integration. Until then, show explicit unavailable/loading states instead of fabricated production claims.
- Run type checks and tests before commits. Do not commit generated secret files or local runtime state.
