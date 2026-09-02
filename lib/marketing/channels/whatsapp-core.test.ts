import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeWhatsAppWebhookPayload,
  verifyWhatsAppChallenge,
} from "./whatsapp-core";

test("normalizes inbound WhatsApp text messages", () => {
  const events = normalizeWhatsAppWebhookPayload({
    object: "whatsapp_business_account",
    entry: [{
      id: "waba-1",
      changes: [{
        field: "messages",
        value: {
          metadata: { phone_number_id: "phone-1", display_phone_number: "+966500000000" },
          contacts: [{ wa_id: "966511111111", profile: { name: "Client" } }],
          messages: [{ id: "wamid.1", from: "966511111111", timestamp: "1788300000", type: "text", text: { body: "مرحبا" } }],
        },
      }],
    }],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.kind, "message");
  if (events[0]?.kind !== "message") return;
  assert.equal(events[0].externalMessageId, "wamid.1");
  assert.equal(events[0].externalThreadId, "966511111111");
  assert.equal(events[0].content, "مرحبا");
  assert.equal(events[0].metadata.phone_number_id, "phone-1");
});

test("normalizes WhatsApp delivery status events", () => {
  const events = normalizeWhatsAppWebhookPayload({
    object: "whatsapp_business_account",
    entry: [{
      id: "waba-1",
      changes: [{
        field: "messages",
        value: {
          metadata: { phone_number_id: "phone-1" },
          statuses: [{ id: "wamid.2", status: "read", recipient_id: "966511111111", timestamp: "1788300001" }],
        },
      }],
    }],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.kind, "status");
  if (events[0]?.kind !== "status") return;
  assert.equal(events[0].externalMessageId, "wamid.2");
  assert.equal(events[0].status, "read");
});

test("verifies WhatsApp webhook challenge without exposing the token", () => {
  assert.equal(verifyWhatsAppChallenge({ mode: "subscribe", verifyToken: "same", challenge: "123", expectedVerifyToken: "same" }), "123");
  assert.equal(verifyWhatsAppChallenge({ mode: "subscribe", verifyToken: "wrong", challenge: "123", expectedVerifyToken: "same" }), null);
});
