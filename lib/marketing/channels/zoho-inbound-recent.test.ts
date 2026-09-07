import test from "node:test";
import assert from "node:assert/strict";

function zohoDate(day: string, subtractDays: number) {
  const parsed = new Date(`${day}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - subtractDays);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(parsed.getUTCDate()).padStart(2, "0")}-${months[parsed.getUTCMonth()]}-${parsed.getUTCFullYear()}`;
}

function automatedSender(email: string) {
  const local = email.split("@")[0] ?? "";
  return /^(mailer-daemon|postmaster|bounce|bounces|no-?reply|do-?not-?reply)$/i.test(local);
}

test("recent Zoho polling backfills from the previous Riyadh day", () => {
  assert.equal(zohoDate("2026-09-06", 1), "05-Sep-2026");
  assert.equal(zohoDate("2026-01-01", 1), "31-Dec-2025");
});

test("recent Zoho polling ignores common automated delivery senders", () => {
  assert.equal(automatedSender("mailer-daemon@example.com"), true);
  assert.equal(automatedSender("noreply@example.com"), true);
  assert.equal(automatedSender("person@example.com"), false);
});
