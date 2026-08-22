# Peter’s Requirements — Development Test Matrix

All names, bookings, passes, payments, events, QR credentials, and support content below are **synthetic development fixtures**. They cannot operate against BGC production systems.

| Requirement | Development implementation | Test path |
| --- | --- | --- |
| Native iOS/Android companion app alongside the website | Shared Expo guest app and Cloudflare-served web review build | Open the preview or run `npm run ios` / `npm run android` in `mobile/` |
| Guests see their cruise and booking | Aurora (confirmed) and Nova (payment attention) profiles | Profile → select a development guest → Trips |
| Onboard QR confirms BGC relationship and paid pass | Short-lived signed QR credential validated server-side | Pass → open scanner sandbox → validate the token |
| Staff sees paid, unpaid, expired, invalid, and unbooked outcomes | Development scanner issues each scenario and verifies it server-side | `/development/scanner` |
| Booking and paid-pass state comes from a data source | Typed Worker fixture adapter models confirmed and awaiting-payment states | Switch between Aurora and Nova in Profile |
| Guests receive reminders and complete outstanding work | Checklist completion calls the synthetic Worker endpoint and updates the UI | Home → tap any incomplete checklist row |
| Guests manage drink packages, passes, beach clubs, and hotels | Add-on hub exposes complete, needed, and available states | Home → Finish the good stuff |
| Guests receive onboard event reminders | Guide and Home expose synthetic event timing, locations, and reminder labels | Guide → Coming up |
| Guests are reminded to book a future cruise | Future-escape panel provides BGC website handoff | Guide → Future escapes |
| Guests see completed cruise count and history | Aurora exposes three past sailings; Nova exposes an empty first-trip state | Trips |
| App links back to website and social | BGC website and Instagram handoffs are visible in Profile | Profile → BGC website / BGC on Instagram |
| Guests invite friends to book | Synthetic invitation endpoint returns a demonstrative invite URL without sending messages | Home → Invite your travel crew |
| Guests can get help without staff follow-up | Small support/FAQ library answers pass, event, and add-on questions | Guide → Help & FAQs |

## Production replacement boundary

Production replaces the Worker fixture adapter and removes development controls. The mobile app retains the typed guest-experience contract, while authoritative booking, pass, add-on, event, history, and entitlement data is retrieved by authenticated server-side integrations. QR credentials remain short-lived and server-validated; static QR images never become authoritative.
