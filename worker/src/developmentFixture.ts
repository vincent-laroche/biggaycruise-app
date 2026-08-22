export type DevelopmentScenario = "paid" | "unpaid" | "expired";
export type QrValidationStatus = "approved" | "unpaid" | "expired" | "invalid";

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

type DevelopmentGuestExperience = {
  environment: "development_fixture";
  notice: string;
  guest: { displayName: string; developmentId: string };
  upcomingCruise: { id: string; name: string; destination: string; departureDate: string; groupStatus: string };
  pass: { id: string; status: "paid"; label: string };
  checklist: Array<{ id: string; title: string; detail: string; completed: boolean }>;
  events: Array<{ id: string; title: string; timing: string; location: string }>;
  reminders: Array<{ id: string; title: string; detail: string }>;
  nextCruise: { title: string; detail: string };
};

const encoder = new TextEncoder();
const developmentFixtureVersion = "2026-08-22" as const;
const developmentGuest = {
  id: "dev-guest-aurora-rivera",
  displayName: "Aurora Rivera",
  cruiseId: "dev-cruise-solstice-2027",
  passId: "dev-pass-aurora-paid",
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  let difference = left.length ^ right.length;
  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function isFixtureModeEnabled(env: DevelopmentFixtureEnv): boolean {
  return env.BGC_DEVELOPMENT_FIXTURES === "true" && Boolean(env.DEV_QR_SIGNING_KEY);
}

export function isDevelopmentFixtureEnabled(env: DevelopmentFixtureEnv): boolean {
  return isFixtureModeEnabled(env);
}

export function getDevelopmentGuestExperience(env: DevelopmentFixtureEnv): DevelopmentGuestExperience | null {
  if (!isFixtureModeEnabled(env)) return null;
  return {
    environment: "development_fixture",
    notice: "Development-only synthetic data. This is not a BGC customer, booking, payment, or operational record.",
    guest: { displayName: developmentGuest.displayName, developmentId: developmentGuest.id },
    upcomingCruise: { id: developmentGuest.cruiseId, name: "Solstice at Sea", destination: "Western Mediterranean", departureDate: "2027-06-12", groupStatus: "BGC group confirmed" },
    pass: { id: developmentGuest.passId, status: "paid", label: "BGC Pass · paid" },
    checklist: [
      { id: "dev-task-pass", title: "BGC pass confirmed", detail: "Your development fixture pass is marked paid.", completed: true },
      { id: "dev-task-package", title: "Choose your drink package", detail: "A reminder can link guests to the current website checkout flow.", completed: false },
      { id: "dev-task-hotel", title: "Review pre-cruise hotel options", detail: "Save this for later or open the BGC site for current options.", completed: false },
    ],
    events: [
      { id: "dev-event-welcome", title: "BGC welcome gathering", timing: "Embarkation evening · 7:00 PM", location: "Venue assigned by BGC" },
      { id: "dev-event-beach", title: "Beach club day", timing: "Port day · details in cruise guide", location: "BGC excursion desk" },
    ],
    reminders: [
      { id: "dev-reminder-invite", title: "Invite your travel crew", detail: "Share the upcoming cruise with friends when referral links are connected." },
      { id: "dev-reminder-next", title: "Start planning your next escape", detail: "BGC can surface the next cruise before guests head home." },
    ],
    nextCruise: { title: "Keep the sparkle going", detail: "Future cruise discovery and friend invitations are ready for integration with the BGC website." },
  };
}

export async function issueDevelopmentQr(env: DevelopmentFixtureEnv, scenario: DevelopmentScenario = "paid", now = Date.now()): Promise<{ token: string; expiresAt: string } | null> {
  if (!isFixtureModeEnabled(env) || !env.DEV_QR_SIGNING_KEY) return null;
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = scenario === "expired" ? issuedAt - 60 : issuedAt + 300;
  const payload: DevelopmentQrPayload = {
    environment: "development_fixture",
    fixtureVersion: developmentFixtureVersion,
    scenario,
    guestId: scenario === "unpaid" ? "dev-guest-nova-unpaid" : developmentGuest.id,
    passId: scenario === "unpaid" ? "dev-pass-nova-unpaid" : developmentGuest.passId,
    cruiseId: developmentGuest.cruiseId,
    issuedAt,
    expiresAt,
  };
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
  try {
    payload = JSON.parse(new TextDecoder().decode(decodedPayload)) as DevelopmentQrPayload;
  } catch {
    return { status: "invalid", message: "The QR credential payload is not valid." };
  }
  if (payload.environment !== "development_fixture" || payload.fixtureVersion !== developmentFixtureVersion || payload.cruiseId !== developmentGuest.cruiseId) return { status: "invalid", message: "This QR credential does not belong to the active development fixture." };
  if (payload.expiresAt <= Math.floor(now / 1000)) return { status: "expired", message: "This QR credential has expired. Ask the guest to refresh their pass." };
  if (payload.scenario === "unpaid") return { status: "unpaid", message: "BGC pass is not paid. Do not grant BGC access.", guestLabel: "Nova Quinn · development fixture", passLabel: "BGC Pass · unpaid" };
  return { status: "approved", message: "BGC pass is paid and active. Grant BGC access.", guestLabel: `${developmentGuest.displayName} · development fixture`, passLabel: "BGC Pass · paid" };
}
