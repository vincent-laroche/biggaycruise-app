import { describe, expect, it } from "vitest";

import { createDevelopmentInvitation, getDevelopmentChecklist, getDevelopmentGuestExperience, issueDevelopmentQr, isDevelopmentFixtureEnabled, validateDevelopmentQr } from "./developmentFixture";

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

  it("exposes distinct paid and unpaid synthetic guest journeys with requirements data", () => {
    const aurora = getDevelopmentGuestExperience(enabledEnv, "aurora");
    const nova = getDevelopmentGuestExperience(enabledEnv, "nova");
    expect(aurora?.guest.completedCruiseCount).toBe(3);
    expect(aurora?.addOns.map((item) => item.kind)).toEqual(expect.arrayContaining(["drink_package", "bgc_pass", "beach_club", "hotel"]));
    expect(aurora?.events.length).toBeGreaterThan(0);
    expect(aurora?.faq.length).toBeGreaterThan(0);
    expect(nova?.booking.status).toBe("awaiting_payment");
    expect(nova?.pass.status).toBe("unpaid");
  });

  it("returns a non-persistent synthetic checklist completion response and invitation handoff", () => {
    const checklist = getDevelopmentChecklist(enabledEnv, "aurora", "dev-task-package", true);
    expect(checklist?.find((item) => item.id === "dev-task-package")?.completed).toBe(true);
    expect(getDevelopmentGuestExperience(enabledEnv, "aurora")?.checklist.find((item) => item.id === "dev-task-package")?.completed).toBe(false);
    const invitation = createDevelopmentInvitation(enabledEnv, "aurora");
    expect(invitation?.inviteUrl).toContain("dev_invite=dev-guest-aurora-rivera");
    expect(invitation?.message).toContain("No message was sent");
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

  it("rejects an unbooked synthetic guest", async () => {
    const credential = await issueDevelopmentQr(enabledEnv, "unbooked", now);
    const result = await validateDevelopmentQr(enabledEnv, credential?.token, now + 1_000);
    expect(result.status).toBe("unbooked");
    expect(result.message).toContain("No active BGC booking");
  });

  it("rejects a tampered credential", async () => {
    const credential = await issueDevelopmentQr(enabledEnv, "paid", now);
    const tampered = `${credential?.token}x`;
    const result = await validateDevelopmentQr(enabledEnv, tampered, now + 1_000);
    expect(result.status).toBe("invalid");
  });
});
