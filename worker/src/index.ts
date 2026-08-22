import { getDevelopmentGuestExperience, isDevelopmentFixtureEnabled, issueDevelopmentQr, validateDevelopmentQr, type DevelopmentScenario } from "./developmentFixture";
import { developmentScannerPage } from "./developmentScannerPage";

type JsonRecord = Record<string, unknown>;

interface Env {
  BGC_DEVELOPMENT_FIXTURES?: string;
  DEV_QR_SIGNING_KEY?: string;
  ASSETS: Fetcher;
}

function json(body: JsonRecord, status = 200, requestId = crypto.randomUUID()): Response {
  return new Response(JSON.stringify({ ...body, requestId }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
    },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function notReady(capability: string): Response {
  return json({
    error: "integration_not_connected",
    capability,
    message: "BGC has not connected the authoritative booking and pass data source yet.",
  }, 503);
}

function allowMethods(request: Request, allowed: string[]): Response | null {
  if (allowed.includes(request.method)) return null;
  return json({ error: "method_not_allowed", allowed }, 405);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 8_192) return null;
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const startedAt = Date.now();
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" } });
    const methodFailure = url.pathname === "/v1/guest/status" || url.pathname === "/v1/guest/experience" || url.pathname === "/v1/guest/qr" || url.pathname === "/development/scanner" ? allowMethods(request, ["GET"]) : url.pathname === "/v1/qr/validate" || url.pathname === "/v1/development/qr" ? allowMethods(request, ["POST"]) : null;
    if (methodFailure) return methodFailure;

    let response: Response;
    if (url.pathname === "/health") {
      response = json({ ok: true, service: "big-gay-cruise-api" });
    } else if (url.pathname === "/v1/guest/status") {
      response = isDevelopmentFixtureEnabled(env) ? json({ state: "ready", title: "Development fixture is connected.", detail: "Synthetic data is enabled for local product development only.", environment: "development_fixture" }) : json({ state: "source_not_connected", title: "Your BGC guest data is not connected yet.", detail: "Once BGC links the booking source, your cruise, pass, reminders, and QR access will appear here automatically." });
    } else if (url.pathname === "/v1/guest/experience") {
      const experience = getDevelopmentGuestExperience(env);
      response = experience ? json(experience) : notReady("guest_experience");
    } else if (url.pathname === "/v1/guest/qr") {
      const credential = await issueDevelopmentQr(env);
      response = credential ? json({ environment: "development_fixture", ...credential, notice: "Synthetic development credential only. It is never valid against BGC production operations." }) : notReady("dynamic_qr_credential");
    } else if (url.pathname === "/v1/qr/validate") {
      const body = await readJsonBody(request);
      if (!body) response = json({ error: "invalid_request", message: "Send a small JSON object containing a QR token." }, 400);
      else if (!isDevelopmentFixtureEnabled(env)) response = notReady("dynamic_qr_validation");
      else response = json({ environment: "development_fixture", ...(await validateDevelopmentQr(env, body.token)) });
    } else if (url.pathname === "/v1/development/qr") {
      const body = await readJsonBody(request);
      const scenario = body?.scenario;
      const allowedScenario: DevelopmentScenario = scenario === "unpaid" || scenario === "expired" ? scenario : "paid";
      const credential = await issueDevelopmentQr(env, allowedScenario);
      response = credential ? json({ environment: "development_fixture", scenario: allowedScenario, ...credential }) : notReady("development_qr_issuer");
    } else if (url.pathname === "/development/scanner") {
      response = isDevelopmentFixtureEnabled(env) ? html(developmentScannerPage(url.origin)) : notReady("development_scanner");
    } else {
      response = await env.ASSETS.fetch(request);
    }

    ctx.waitUntil(Promise.resolve(console.log(JSON.stringify({ event: "api_request", path: url.pathname, method: request.method, status: response.status, durationMs: Date.now() - startedAt }))));
    return response;
  },
} satisfies ExportedHandler<Env>;
