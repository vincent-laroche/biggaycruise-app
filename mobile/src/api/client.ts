export type DevelopmentGuestKey = "aurora" | "nova";
export type GuestAppStatus = { state: "loading" } | { state: "source_not_connected"; title: string; detail: string } | { state: "ready"; title: string; detail: string };
export type ChecklistTask = { id: string; title: string; detail: string; completed: boolean; category: "booking" | "add_on" | "travel" };
export type GuestExperience = {
  environment: "development_fixture";
  notice: string;
  guest: { key: DevelopmentGuestKey; displayName: string; developmentId: string; completedCruiseCount: number; accountStatus: string };
  availableGuests: Array<{ key: DevelopmentGuestKey; displayName: string; state: string }>;
  booking: { id: string; status: "confirmed" | "awaiting_payment"; label: string };
  upcomingCruise: { id: string; name: string; destination: string; departureDate: string; groupStatus: string };
  pass: { id: string; status: "paid" | "unpaid"; label: string };
  checklist: ChecklistTask[];
  addOns: Array<{ id: string; title: string; detail: string; status: "complete" | "needed" | "available"; kind: "drink_package" | "bgc_pass" | "beach_club" | "hotel" }>;
  events: Array<{ id: string; title: string; timing: string; location: string; reminder: string }>;
  reminders: Array<{ id: string; title: string; detail: string; action: "invite" | "next_cruise" | "add_ons" }>;
  history: Array<{ id: string; name: string; destination: string; year: string }>;
  invitation: { title: string; detail: string };
  externalLinks: { website: string; instagram: string; facebook: string };
  faq: Array<{ id: string; question: string; answer: string }>;
  nextCruise: { title: string; detail: string; websiteUrl: string };
};

export type GuestQrCredential = { environment: "development_fixture"; token: string; expiresAt: string; notice: string };
export type DevelopmentInvitation = { environment: "development_fixture"; inviteUrl: string; message: string; expiresAt: string };

const explicitApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const apiBaseUrl = explicitApiBaseUrl || (typeof window !== "undefined" ? window.location.origin : undefined);

export function isApiConfigured(): boolean { return Boolean(apiBaseUrl); }
function baseUrl(): string { if (!apiBaseUrl) throw new Error("BGC app API is not configured."); return apiBaseUrl.replace(/\/$/, ""); }
async function apiJson<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${baseUrl()}${path}`, init); if (!response.ok) throw new Error(`BGC API request failed (${response.status}).`); return response.json() as Promise<T>; }

export async function getGuestAppStatus(): Promise<GuestAppStatus> {
  if (!apiBaseUrl) return { state: "source_not_connected", title: "Your BGC guest data is not connected yet.", detail: "Once BGC links the booking source, your cruise, pass, reminders, and QR access will appear here automatically." };
  try {
    const data = await apiJson<{ state?: string; title?: string; detail?: string }>("/v1/guest/status");
    return { state: data.state === "ready" ? "ready" : "source_not_connected", title: data.title ?? "Your BGC guest data is not connected yet.", detail: data.detail ?? "BGC will make your travel experience available here once the booking source is linked." };
  } catch {
    return { state: "source_not_connected", title: "We could not reach your BGC guest data.", detail: "Please try again later. If this continues, BGC support can help confirm your booking connection." };
  }
}

export async function getGuestExperience(guest: DevelopmentGuestKey = "aurora"): Promise<GuestExperience> { return apiJson<GuestExperience>(`/v1/guest/experience?guest=${encodeURIComponent(guest)}`); }
export async function getGuestQrCredential(guest: DevelopmentGuestKey = "aurora"): Promise<GuestQrCredential> { return apiJson<GuestQrCredential>(`/v1/guest/qr?guest=${encodeURIComponent(guest)}`); }
export async function updateDevelopmentChecklist(guest: DevelopmentGuestKey, taskId: string, completed: boolean): Promise<{ checklist: ChecklistTask[]; notice: string }> { return apiJson("/v1/development/checklist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ guest, taskId, completed }) }); }
export async function createDevelopmentInvitation(guest: DevelopmentGuestKey): Promise<DevelopmentInvitation> { return apiJson<DevelopmentInvitation>("/v1/development/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ guest }) }); }
