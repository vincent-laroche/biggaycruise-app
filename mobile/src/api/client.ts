export type GuestAppStatus = { state: "loading" } | { state: "source_not_connected"; title: string; detail: string } | { state: "ready"; title: string; detail: string };

export type GuestExperience = {
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

export type GuestQrCredential = { environment: "development_fixture"; token: string; expiresAt: string; notice: string };

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export function isApiConfigured(): boolean {
  return Boolean(apiBaseUrl);
}

function baseUrl(): string {
  if (!apiBaseUrl) throw new Error("BGC app API is not configured.");
  return apiBaseUrl.replace(/\/$/, "");
}

async function apiJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`);
  if (!response.ok) throw new Error(`BGC API request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export async function getGuestAppStatus(): Promise<GuestAppStatus> {
  if (!apiBaseUrl) {
    return {
      state: "source_not_connected",
      title: "Your BGC guest data is not connected yet.",
      detail: "Once BGC links the booking source, your cruise, pass, reminders, and QR access will appear here automatically.",
    };
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/v1/guest/status`);
    if (!response.ok) throw new Error("Guest status unavailable");
    const data = await response.json() as { state?: string; title?: string; detail?: string };
    return {
      state: data.state === "ready" ? "ready" : "source_not_connected",
      title: data.title ?? "Your BGC guest data is not connected yet.",
      detail: data.detail ?? "BGC will make your travel experience available here once the booking source is linked.",
    };
  } catch {
    return {
      state: "source_not_connected",
      title: "We could not reach your BGC guest data.",
      detail: "Please try again later. If this continues, BGC support can help confirm your booking connection.",
    };
  }
}

export async function getGuestExperience(): Promise<GuestExperience> {
  return apiJson<GuestExperience>("/v1/guest/experience");
}

export async function getGuestQrCredential(): Promise<GuestQrCredential> {
  return apiJson<GuestQrCredential>("/v1/guest/qr");
}
