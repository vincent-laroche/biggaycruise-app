import { describe, expect, it } from "vitest";

import { getDevelopmentGuestExperience, issueDevelopmentQr, isDevelopmentFixtureEnabled, validateDevelopmentQr } from "./developmentFixture";

const enabledEnv = { BGC_DEVELOPMENT_FIXTURES: "true", DEV_QR_SIGNING_KEY: "test-only-development-signing-key" };
const disabledEnv = { BGC_DEVELOPMENT_FIXTURES: "false", DEV_QR_SIGNING_KEY: "test-only-development-signing-key" };
const now = Date.parse("2026-08-22T12:00:00.000Z");

describe("development fixture boundary", () => {
  it("does not expose synthetic guest data unless the explicit fixture switch is enabled", () => {
    expect(isDevelopmentFixtureEnabled(disabledEnv)).toBe(false);
    expect(getDevelopmentGuestExperience(disabledEnv)).toBeNull();
  });

  it("labels every enabled guest experience as synthetic development data", () => {
    const fixture = getDevelopmentGuestExperience(enabledEnv);
    expect(fixture?.environment).toBe("development_fixture");
    expect(fixture?.notice).toContain("not a BGC customer");
    expect(fixture?.pass.status).toBe("paid");
  });
});

describe("development QR validation", () => {
  it("approves a paid development credential that is still within its short lifetime", async () => {
    const credential = await issueDevelopmentQr(enabledEnv, "paid", now);
    const result = await validateDevelopmentQr(enabledEnv, credential?.token, now + 1_000);
    expect(result.status).toBe("approved");
    expect(result.message).toContain("Grant BGC access");
  });

  it("rejects an unpaid development pass without granting access", async () => {
    const credential = await issueDevelopmentQr(enabledEnv, "unpaid", now);
    const result = await validateDevelopmentQr(enabledEnv, credential?.token, now + 1_000);
    expect(result.status).toBe("unpaid");
    expect(result.message).toContain("Do not grant BGC access");
  });

  it("rejects an expired development credential", async () => {
    const credential = await issueDevelopmentQr(enabledEnv, "expired", now);
    const result = await validateDevelopmentQr(enabledEnv, credential?.token, now);
    expect(result.status).toBe("expired");
  });

  it("rejects a tampered credential", async () => {
    const credential = await issueDevelopmentQr(enabledEnv, "paid", now);
    const tampered = `${credential?.token}x`;
    const result = await validateDevelopmentQr(enabledEnv, tampered, now + 1_000);
    expect(result.status).toBe("invalid");
  });
});
