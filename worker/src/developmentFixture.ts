export type DevelopmentGuestKey = "aurora" | "nova";
export type DevelopmentScenario = "paid" | "unpaid" | "expired" | "unbooked";
export type QrValidationStatus = "approved" | "unpaid" | "expired" | "unbooked" | "invalid";

export type DevelopmentFixtureEnv = {
  BGC_DEVELOPMENT_FIXTURES?: string;
  DEV_QR_SIGNING_KEY?: string;
};

type DevelopmentQrPayload = {
  environment: "development_fixture";
  fixtureVersion: "2026-08-22";
  scenario: DevelopmentScenario;
  guestId: string;
  passId: string;
  cruiseId: string;
  issuedAt: number;
  expiresAt: number;
};

export type DevelopmentGuestExperience = {
  environment: "development_fixture";
  notice: string;
  guest: { key: DevelopmentGuestKey; displayName: string; developmentId: string; completedCruiseCount: number; accountStatus: string };
  availableGuests: Array<{ key: DevelopmentGuestKey; displayName: string; state: string }>;
  booking: { id: string; status: "confirmed" | "awaiting_payment"; label: string };
  upcomingCruise: { id: string; name: string; destination: string; departureDate: string; groupStatus: string };
  pass: { id: string; status: "paid" | "unpaid"; label: string };
  checklist: Array<{ id: string; title: string; detail: string; completed: boolean; category: "booking" | "add_on" | "travel" }>;
  addOns: Array<{ id: string; title: string; detail: string; status: "complete" | "needed" | "available"; kind: "drink_package" | "bgc_pass" | "beach_club" | "hotel" }>;
  events: Array<{ id: string; title: string; timing: string; location: string; reminder: string }>;
  reminders: Array<{ id: string; title: string; detail: string; action: "invite" | "next_cruise" | "add_ons" }>;
  history: Array<{ id: string; name: string; destination: string; year: string }>;
  invitation: { title: string; detail: string };
  externalLinks: { website: string; instagram: string; facebook: string };
  faq: Array<{ id: string; question: string; answer: string }>;
  nextCruise: { title: string; detail: string; websiteUrl: string };
};

const encoder = new TextEncoder();
const developmentFixtureVersion = "2026-08-22" as const;
const notice = "Development-only synthetic data. This is not a BGC customer, booking, payment, or operational record.";

const fixtures: Record<DevelopmentGuestKey, Omit<DevelopmentGuestExperience, "environment" | "notice" | "availableGuests">> = {
  aurora: {
    guest: { key: "aurora", displayName: "Aurora Rivera", developmentId: "dev-guest-aurora-rivera", completedCruiseCount: 3, accountStatus: "Confirmed BGC guest" },
    booking: { id: "dev-booking-aurora-solstice", status: "confirmed", label: "Booking confirmed" },
    upcomingCruise: { id: "dev-cruise-solstice-2027", name: "Solstice at Sea", destination: "Western Mediterranean", departureDate: "2027-06-12", groupStatus: "BGC group confirmed" },
    pass: { id: "dev-pass-aurora-paid", status: "paid", label: "BGC Pass · paid" },
    checklist: [
      { id: "dev-task-pass", title: "BGC pass confirmed", detail: "Your synthetic BGC pass is marked paid.", completed: true, category: "booking" },
      { id: "dev-task-package", title: "Choose your drink package", detail: "Compare package options before sailing.", completed: false, category: "add_on" },
      { id: "dev-task-beach", title: "Reserve the beach club", detail: "Secure your preferred port-day experience.", completed: false, category: "add_on" },
      { id: "dev-task-hotel", title: "Review pre-cruise hotel options", detail: "Book a stay near the departure port if useful.", completed: false, category: "travel" },
    ],
    addOns: [
      { id: "dev-addon-drinks", title: "Drink package", detail: "Not selected yet", status: "needed", kind: "drink_package" },
      { id: "dev-addon-pass", title: "BGC Pass", detail: "Paid and ready", status: "complete", kind: "bgc_pass" },
      { id: "dev-addon-beach", title: "Beach club day", detail: "Reservation available", status: "available", kind: "beach_club" },
      { id: "dev-addon-hotel", title: "Pre-cruise hotel", detail: "Browse BGC recommendations", status: "available", kind: "hotel" },
    ],
    events: [
      { id: "dev-event-welcome", title: "BGC welcome gathering", timing: "Embarkation evening · 7:00 PM", location: "Venue assigned by BGC", reminder: "One hour before" },
      { id: "dev-event-beach", title: "Beach club day", timing: "Port day · 11:00 AM", location: "BGC excursion desk", reminder: "Morning of" },
      { id: "dev-event-sunset", title: "Sunset deck social", timing: "Sea day · 6:30 PM", location: "Upper deck", reminder: "Thirty minutes before" },
    ],
    reminders: [
      { id: "dev-reminder-invite", title: "Invite your travel crew", detail: "Share the upcoming cruise with friends and let them explore BGC booking.", action: "invite" },
      { id: "dev-reminder-next", title: "Plan your next escape", detail: "See a future cruise before this voyage ends.", action: "next_cruise" },
      { id: "dev-reminder-addons", title: "Finish your extras", detail: "Drink package, beach club, and hotel options are ready to review.", action: "add_ons" },
    ],
    history: [
      { id: "dev-history-2025", name: "Prism at Sea", destination: "Eastern Caribbean", year: "2025" },
      { id: "dev-history-2024", name: "Sail the Rainbow", destination: "Mexican Riviera", year: "2024" },
      { id: "dev-history-2023", name: "Ocean of Us", destination: "Bahamas", year: "2023" },
    ],
    invitation: { title: "Bring your people", detail: "Create a development invitation and see how BGC can encourage friends to discover the same sailing." },
    externalLinks: { website: "https://biggaycruise.com/", instagram: "https://www.instagram.com/biggaycruise/", facebook: "https://www.facebook.com/biggaycruise/" },
    faq: [
      { id: "dev-faq-pass", question: "Where do I show my BGC pass?", answer: "Open the Pass tab once onboard. Staff scan a live credential and verify entitlement server-side." },
      { id: "dev-faq-events", question: "Where do event details appear?", answer: "The Guide keeps confirmed BGC moments, locations, and timely reminders together." },
      { id: "dev-faq-addons", question: "Can I still add extras?", answer: "Development data shows drink, beach club, and hotel prompts. Production will hand off to BGC-approved purchase flows." },
    ],
    nextCruise: { title: "Keep the sparkle going", detail: "Discover future BGC trips before you disembark and invite your crew along.", websiteUrl: "https://biggaycruise.com/" },
  },
  nova: {
    guest: { key: "nova", displayName: "Nova Quinn", developmentId: "dev-guest-nova-quinn", completedCruiseCount: 0, accountStatus: "Booking payment attention needed" },
    booking: { id: "dev-booking-nova-solstice", status: "awaiting_payment", label: "Booking held · pass unpaid" },
    upcomingCruise: { id: "dev-cruise-solstice-2027", name: "Solstice at Sea", destination: "Western Mediterranean", departureDate: "2027-06-12", groupStatus: "BGC group held" },
    pass: { id: "dev-pass-nova-unpaid", status: "unpaid", label: "BGC Pass · payment needed" },
    checklist: [
      { id: "dev-task-nova-pass", title: "Complete BGC pass payment", detail: "This synthetic pass is intentionally unpaid for testing.", completed: false, category: "booking" },
      { id: "dev-task-nova-drinks", title: "Choose your drink package", detail: "Review current options before sailing.", completed: false, category: "add_on" },
      { id: "dev-task-nova-hotel", title: "Review pre-cruise hotel options", detail: "Choose a stay near the departure port.", completed: false, category: "travel" },
    ],
    addOns: [
      { id: "dev-addon-nova-pass", title: "BGC Pass", detail: "Payment needed before access", status: "needed", kind: "bgc_pass" },
      { id: "dev-addon-nova-drinks", title: "Drink package", detail: "Available to add", status: "available", kind: "drink_package" },
      { id: "dev-addon-nova-beach", title: "Beach club day", detail: "Available to reserve", status: "available", kind: "beach_club" },
      { id: "dev-addon-nova-hotel", title: "Pre-cruise hotel", detail: "Browse BGC recommendations", status: "available", kind: "hotel" },
    ],
    events: [
      { id: "dev-event-nova-welcome", title: "BGC welcome gathering", timing: "Embarkation evening · 7:00 PM", location: "Venue assigned by BGC", reminder: "One hour before" },
      { id: "dev-event-nova-beach", title: "Beach club day", timing: "Port day · 11:00 AM", location: "BGC excursion desk", reminder: "Morning of" },
    ],
    reminders: [
      { id: "dev-reminder-nova-pass", title: "Finish your BGC pass", detail: "Resolve payment before the cruise so your access is ready.", action: "add_ons" },
      { id: "dev-reminder-nova-invite", title: "Invite your travel crew", detail: "Share the sailing with friends when you are ready.", action: "invite" },
      { id: "dev-reminder-nova-next", title: "Plan your next escape", detail: "Future cruise discovery appears here before you leave.", action: "next_cruise" },
    ],
    history: [],
    invitation: { title: "Make it a group trip", detail: "See a synthetic invitation flow without sending any real messages." },
    externalLinks: { website: "https://biggaycruise.com/", instagram: "https://www.instagram.com/biggaycruise/", facebook: "https://www.facebook.com/biggaycruise/" },
    faq: [
      { id: "dev-faq-nova-pass", question: "Why is my pass not ready?", answer: "This development profile intentionally models an unpaid pass. Resolve the fixture payment state to test approved access." },
      { id: "dev-faq-nova-help", question: "Who can help with my booking?", answer: "Production will route guests to BGC-approved support and booking workflows." },
    ],
    nextCruise: { title: "Choose the next one together", detail: "BGC can introduce future trips when your current booking is settled.", websiteUrl: "https://biggaycruise.com/" },
  },
};

function base64UrlEncode(bytes: Uint8Array): string { let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function base64UrlDecode(value: string): Uint8Array | null { try { const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="); return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)); } catch { return null; } }
async function hmac(value: string, secret: string): Promise<Uint8Array> { const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))); }
function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean { let difference = left.length ^ right.length; const maxLength = Math.max(left.length, right.length); for (let index = 0; index < maxLength; index += 1) difference |= (left[index] ?? 0) ^ (right[index] ?? 0); return difference === 0; }
function isFixtureModeEnabled(env: DevelopmentFixtureEnv): boolean { return env.BGC_DEVELOPMENT_FIXTURES === "true" && Boolean(env.DEV_QR_SIGNING_KEY); }
function fixtureGuestKey(value: unknown): DevelopmentGuestKey { return value === "nova" ? "nova" : "aurora"; }

export function isDevelopmentFixtureEnabled(env: DevelopmentFixtureEnv): boolean { return isFixtureModeEnabled(env); }
export function getDevelopmentGuestExperience(env: DevelopmentFixtureEnv, guestKey: DevelopmentGuestKey = "aurora"): DevelopmentGuestExperience | null {
  if (!isFixtureModeEnabled(env)) return null;
  const fixture = fixtures[guestKey];
  return { environment: "development_fixture", notice, ...fixture, checklist: fixture.checklist.map((item) => ({ ...item })), availableGuests: Object.values(fixtures).map((guest) => ({ key: guest.guest.key, displayName: guest.guest.displayName, state: guest.pass.status === "paid" ? "Pass paid" : "Pass payment needed" })) };
}
export function getDevelopmentChecklist(env: DevelopmentFixtureEnv, guestKey: DevelopmentGuestKey, taskId: string, completed: boolean) {
  const fixture = getDevelopmentGuestExperience(env, guestKey);
  if (!fixture) return null;
  return fixture.checklist.map((task) => task.id === taskId ? { ...task, completed } : task);
}
export function createDevelopmentInvitation(env: DevelopmentFixtureEnv, guestKey: DevelopmentGuestKey) {
  if (!isFixtureModeEnabled(env)) return null;
  const guest = fixtures[guestKey].guest;
  return { environment: "development_fixture" as const, inviteUrl: `https://biggaycruise.com/?dev_invite=${guest.developmentId}`, message: `Synthetic invite created for ${guest.displayName}. No message was sent.`, expiresAt: "2027-06-05T17:00:00.000Z" };
}

export async function issueDevelopmentQr(env: DevelopmentFixtureEnv, scenario: DevelopmentScenario = "paid", now = Date.now(), guestKey: DevelopmentGuestKey = scenario === "unpaid" ? "nova" : "aurora"): Promise<{ token: string; expiresAt: string } | null> {
  if (!isFixtureModeEnabled(env) || !env.DEV_QR_SIGNING_KEY) return null;
  const guest = fixtures[guestKey];
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = scenario === "expired" ? issuedAt - 60 : issuedAt + 300;
  const payload: DevelopmentQrPayload = { environment: "development_fixture", fixtureVersion: developmentFixtureVersion, scenario, guestId: scenario === "unbooked" ? "dev-guest-dario-unbooked" : guest.guest.developmentId, passId: scenario === "unbooked" ? "dev-pass-dario-unbooked" : guest.pass.id, cruiseId: guest.upcomingCruise.id, issuedAt, expiresAt };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = base64UrlEncode(await hmac(encodedPayload, env.DEV_QR_SIGNING_KEY));
  return { token: `bgc-dev.${encodedPayload}.${signature}`, expiresAt: new Date(expiresAt * 1000).toISOString() };
}

export async function validateDevelopmentQr(env: DevelopmentFixtureEnv, token: unknown, now = Date.now()): Promise<{ status: QrValidationStatus; message: string; guestLabel?: string; passLabel?: string }> {
  if (!isFixtureModeEnabled(env) || !env.DEV_QR_SIGNING_KEY || typeof token !== "string") return { status: "invalid", message: "This QR credential cannot be verified." };
  const [prefix, encodedPayload, signature] = token.split(".");
  if (prefix !== "bgc-dev" || !encodedPayload || !signature) return { status: "invalid", message: "The QR credential format is not valid." };
  const expectedSignature = base64UrlEncode(await hmac(encodedPayload, env.DEV_QR_SIGNING_KEY));
  if (!constantTimeEqual(encoder.encode(signature), encoder.encode(expectedSignature))) return { status: "invalid", message: "The QR credential signature is not valid." };
  const decodedPayload = base64UrlDecode(encodedPayload);
  if (!decodedPayload) return { status: "invalid", message: "The QR credential could not be decoded." };
  let payload: DevelopmentQrPayload;
  try { payload = JSON.parse(new TextDecoder().decode(decodedPayload)) as DevelopmentQrPayload; } catch { return { status: "invalid", message: "The QR credential payload is not valid." }; }
  if (payload.environment !== "development_fixture" || payload.fixtureVersion !== developmentFixtureVersion || !Object.values(fixtures).some((fixture) => fixture.upcomingCruise.id === payload.cruiseId)) return { status: "invalid", message: "This QR credential does not belong to the active development fixture." };
  if (payload.expiresAt <= Math.floor(now / 1000)) return { status: "expired", message: "This QR credential has expired. Ask the guest to refresh their pass." };
  if (payload.scenario === "unbooked") return { status: "unbooked", message: "No active BGC booking was found. Do not grant BGC access.", guestLabel: "Dario Vela · unbooked development fixture", passLabel: "No active BGC pass" };
  if (payload.scenario === "unpaid") return { status: "unpaid", message: "BGC pass is not paid. Do not grant BGC access.", guestLabel: "Nova Quinn · development fixture", passLabel: "BGC Pass · unpaid" };
  const guest = Object.values(fixtures).find((fixture) => fixture.guest.developmentId === payload.guestId) ?? fixtures.aurora;
  return { status: "approved", message: "BGC pass is paid and active. Grant BGC access.", guestLabel: `${guest.guest.displayName} · development fixture`, passLabel: "BGC Pass · paid" };
}

export function parseDevelopmentGuestKey(value: unknown): DevelopmentGuestKey { return fixtureGuestKey(value); }
