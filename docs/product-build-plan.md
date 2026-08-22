# Big Gay Cruise Guest App — Product Build Plan

## Goal

Design and build a premium **iOS and Android guest companion app** for Big Gay Cruise (BGC) that complements, rather than replaces, `biggaycruise.com`. The app will give guests a simple mobile home for their bookings, cruise activity, paid BGC passes, onboarding reminders, onboard events, next-cruise discovery, and shareable invitations.

The app must use BGC’s current brand identity and support a secure, operationally reliable source of booking and pass-status data. It must also provide an onboard QR credential that staff can validate before granting BGC access.

## Confirmed Product Inputs

| Topic | Confirmed requirement |
|---|---|
| Primary decision-maker | Peter, Founder and CEO |
| Platforms | Native iOS and Android experience from one shared codebase |
| Website relationship | The current website remains the public marketing and discovery site; the app provides the logged-in guest experience and links back to web and social content where appropriate |
| Core guest value | See current and past cruises, understand what remains to be completed, receive timely reminders, access events, and manage the BGC cruise experience simply |
| Operational validation | Guests present a QR code onboard; staff can verify the guest belongs to BGC and that the BGC pass is paid |
| Data requirement | BGC needs to import or synchronize new bookings and update booking/BGC-pass paid status from an authoritative data source |
| Commerce and upsell | Surface relevant next actions such as booking the next cruise, drink packages, BGC passes, beach-club tickets, and pre-cruise hotels |
| Differentiator | Let guests share an upcoming cruise with friends and invite them to book |

## Product Direction

Build a **single Expo/React Native application** for iOS and Android. The public website should continue to own acquisition, broad cruise discovery, SEO, and non-authenticated marketing. The app should own authenticated, timely, personalized, and operationally sensitive guest experiences.

> The first release should be a guest companion and operations-validation product, not a replacement for the website or a payment processor. It may deep-link to web checkout initially while preserving a clear pathway to native commerce later.

This boundary reduces delivery risk while allowing the app to become BGC’s premium loyalty and repeat-booking channel.

## Product Architecture

### Client Applications

Use the Expo mobile stack: React Native, Expo Router, TypeScript, native notification support, secure device storage, and a shared visual system based on BGC’s existing brand. Build for both iOS and Android from one codebase.

### Backend and Cloudflare Role

At execution, install and inspect the supplied `product-design`, `cloudflare`, and attached `build-ios-apps` plugin resources before selecting exact implementation conventions. The expected backend shape is:

| Layer | Responsibility |
|---|---|
| Mobile API / BFF | Authenticate guests, return only authorized booking/pass/event/checklist data, issue QR credentials, receive checklist actions, and route app notifications |
| Cloudflare edge layer | Deploy edge/API functions where appropriate; protect public endpoints; handle rate limiting, signed-token verification, webhook intake, and controlled cache behavior |
| Transactional datastore | Store BGC-owned guest-app records, audit events, checklist state, device tokens, invitations, and synchronization cursors |
| Private object storage | Store authorized documents and media only; never expose guest files or raw source data through public URLs |
| Integration adapter | Map the authoritative booking/pass source into an internal normalized model; support import first, then provider API or webhook synchronization when available |

Do **not** connect the mobile client directly to an Excel file, external booking provider, or payment source. Use a server-side adapter, validation rules, idempotent imports, sync logs, and an audit trail.

### Core Domain Model

Create normalized records for:

- Guest account and consent state.
- Cruise/sailing, booking, cabin/group membership, and guest cruise history.
- BGC pass entitlement and payment/activation status.
- Event, itinerary item, optional product/add-on, and completion checklist item.
- Guest checklist completion and notification preference/history.
- QR credential issuance, scan result, scanner identity, and access audit event.
- Referral/share link, invitation, and attributed conversion where tracking consent permits.

## QR Credential and Onboard Validation

Use a **dynamic, short-lived, signed QR credential** generated only for an authenticated guest. The QR must contain no payment-card or excessive personal data. A staff-facing scanner experience—initially a secure responsive web/PWA scanner—must call the backend to validate:

1. The QR signature and expiry.
2. The guest’s booking association with the relevant cruise/group.
3. The BGC pass status, including whether it is paid/active.
4. Whether the credential has been revoked, used in an invalid context, or scanned unusually often.

Record each scan outcome for operational support. Define a permitted offline fallback only after BGC establishes onboard connectivity and fraud-risk requirements; static, indefinitely valid QR codes are not acceptable.

## Guest Information Architecture

Use five principal destinations:

| Destination | Purpose | Release priority |
|---|---|---|
| Home | Next important action, countdown, upcoming event, reminders, and quick QR entry | Phase 1 |
| My Cruises | Upcoming and completed cruises, booking status, cabin/group context, and next-cruise prompts | Phase 1 |
| My Pass | Dynamic QR credential, BGC-pass status, and access instructions | Phase 1 |
| Cruise Guide | Event schedule, onboard reminders, optional extras, local/pre-cruise context, and social links | Phase 1–2 |
| Profile | Contact details, notification preferences, support, and privacy controls | Phase 1 |

## Phased Product Scope

### Phase 0 — Integration and Product Foundation

Establish the authoritative source for bookings, BGC pass status, paid status, and guest identity. Map its fields, identify update ownership, define sync latency targets, create a non-production import fixture from authorized real data, and establish access/retention rules. Produce the app information architecture, branded design system, high-fidelity guest flows, staff scanner flow, and acceptance criteria.

**Exit criterion:** A test guest and staff operator can see correct booking and pass status from the normalized data model.

### Phase 1 — Guest Companion MVP

Deliver account access; a guest home screen; upcoming/past cruises; dynamic QR with paid-pass verification; task checklist; timely reminder notifications; event schedule; website/social deep links; and staff scanner PWA. Provide creator/operations views for booking/pass data synchronization and scan audit.

**Exit criterion:** A real guest can authenticate, see an accurate upcoming cruise, complete actions, receive reminders, and be successfully validated at a staff scan point.

### Phase 2 — Conversion and Onboard Experience

Add contextual add-on reminders and deep links for drink packages, BGC passes, beach-club tickets, pre-cruise hotels, and next-cruise booking. Add targeted event reminders, richer trip content, and in-app support/escalation pathways. Maintain native checkout as a separate decision after payment and provider requirements are known.

**Exit criterion:** Guests receive relevant, non-spammy conversion prompts and operators can measure completion and engagement without relying on manual spreadsheets.

### Phase 3 — Differentiation and Loyalty

Add shareable upcoming-cruise invitations, referral attribution, group coordination, loyalty/history insights, and a repeat-cruise offer flow. Evaluate advanced ideas only after Phase 1 instrumentation demonstrates guest adoption and data reliability.

**Exit criterion:** BGC can measure invited bookings, returning guests, and conversion from personalized next-cruise prompts.

## Product Design Deliverables

Before implementation, create the following with the `product-design` resource after it is installed and inspected:

1. A product brief with prioritized jobs-to-be-done, personas, constraints, and success signals.
2. Guest journey maps from booking through pre-cruise, embarkation, onboard use, and post-cruise retention.
3. Screen inventory and user flows for guest, staff scanner, and BGC operator roles.
4. BGC-native visual system: color tokens, typography, iconography, component states, motion, empty/loading/error states, and accessible contrast.
5. Prototype-level acceptance criteria for all Phase 1 flows.

## Integration Discovery Required Before Build

These answers materially affect architecture and must be confirmed during Phase 0:

| Open decision | Why it matters | Planned resolution |
|---|---|---|
| Booking/pass source of truth | Determines sync method, IDs, update latency, and data quality controls | Inspect current spreadsheet/process and available provider APIs/webhooks |
| Payment status owner | Determines whether BGC receives a status-only signal or needs reconciliation | Define payment-state fields and permitted update authority |
| Guest identity/matching rule | Needed to avoid duplicate or mis-linked bookings | Select durable booking/guest IDs; do not rely on name alone |
| Authentication model | Determines invite, account recovery, and shared-device behavior | Compare magic link/email, social sign-in, and BGC-issued invite flows |
| Push-notification policy | Required for consent, timing, and guest trust | Define triggers, opt-in language, quiet hours, and preference center |
| Store accounts and domains | Required for App Store/Play Store publishing and universal/deep links | Confirm BGC-owned Apple/Google accounts and verified domains |

## Security and Privacy Requirements

- Treat bookings, payment state, and QR scans as sensitive operational data.
- Store payment status only; do not store payment-card data in the app platform.
- Enforce role-based access for guest, staff scanner, and BGC operator roles.
- Use least-privilege integration credentials, server-side secrets, signed expiring QR tokens, rate limits, audit logs, and revocation.
- Obtain consent for notifications and referral attribution; provide account/privacy support paths.
- Use authorized data only. Anonymize client data in planning/demo environments and define retention/deletion rules before production ingestion.

## Quality and Test Plan

| Area | Validation |
|---|---|
| Data integration | Contract tests, idempotent import tests, field-mapping validation, failure/retry visibility |
| Guest application | Unit/component tests, API integration tests, iOS/Android manual acceptance paths, accessibility review |
| QR validation | Token expiry, tamper rejection, revoked pass, unpaid pass, wrong-cruise, staff authorization, and scan-audit tests |
| Notifications | Permission states, opt-out, scheduled trigger correctness, duplicate prevention, deep-link destination tests |
| Security | Authorization tests across all roles, secret handling review, rate-limit checks, audit-log verification |
| Release | Staged test cohort, support runbook, crash monitoring, analytics validation, App Store/Play Store review checklist |

## Execution Sequence

After plan approval, proceed in this order:

1. Install/load the requested `/Users/vMac/.manus/skills/product-design/`, `/Users/vMac/.manus/skills/cloudflare/`, and supplied archive resources in the active development environment; inspect their instructions before using them.
2. Inspect the supplied local repository at `/Users/vMac/02_dev/app-biggaycruise` (mounted workspace target); preserve its existing conventions and identify whether it already contains a mobile, backend, or Cloudflare foundation. Use the selected GitHub repository as the remote source of record only after reconciling the local working tree.
3. Convert this plan into the product-design artifacts and a Phase 0 integration checklist.
4. Confirm the source-of-truth and guest-data contract with Peter/BGC before building booking or payment synchronization.
5. Scaffold the Expo iOS/Android app, secure backend, Cloudflare edge layer, and staff scanner experience.
6. Implement and test Phase 1 end-to-end before expanding commerce or referral features.

## Assumptions and Risks

This plan assumes that BGC may authorize access to booking/pass data but has not yet specified the actual provider or field structure. It also assumes that current website checkout remains active during the MVP. The largest schedule and architecture risks are data-source quality, external provider/API limits, app-store account ownership, payment-status reconciliation, onboard network reliability, and final decisions on native versus web checkout.

The requested local skill paths and attached archive could not be installed or inspected in Plan Mode. They are deliberately treated as an execution prerequisite, not as an assumed capability in this plan.
