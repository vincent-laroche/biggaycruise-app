type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200, requestId = crypto.randomUUID()): Response {
  return new Response(JSON.stringify({ ...body, requestId }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
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

export default {
  async fetch(request: Request, _env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const startedAt = Date.now();
    const methodFailure = url.pathname === "/v1/guest/status" ? allowMethods(request, ["GET"]) : url.pathname === "/v1/qr/validate" ? allowMethods(request, ["POST"]) : null;
    if (methodFailure) return methodFailure;

    let response: Response;
    if (url.pathname === "/health") {
      response = json({ ok: true, service: "big-gay-cruise-api" });
    } else if (url.pathname === "/v1/guest/status") {
      response = json({
        state: "source_not_connected",
        title: "Your BGC guest data is not connected yet.",
        detail: "Once BGC links the booking source, your cruise, pass, reminders, and QR access will appear here automatically.",
      });
    } else if (url.pathname === "/v1/qr/validate") {
      response = notReady("dynamic_qr_validation");
    } else {
      response = json({ error: "not_found" }, 404);
    }

    ctx.waitUntil(Promise.resolve(console.log(JSON.stringify({ event: "api_request", path: url.pathname, method: request.method, status: response.status, durationMs: Date.now() - startedAt }))));
    return response;
  },
} satisfies ExportedHandler<Env>;
