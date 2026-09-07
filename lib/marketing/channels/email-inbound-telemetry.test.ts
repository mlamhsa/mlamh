import { describe, expect, it } from "vitest";

import { classifyInboundEmailAutomation, inboundAutomationEventName } from "./email-inbound-telemetry";

describe("email inbound automation telemetry", () => {
  it("classifies delivery failures as bounce", () => {
    expect(classifyInboundEmailAutomation({
      senderEmail: "mailer-daemon@example.com",
      subject: "Mail delivery failed: returning message to sender",
    })).toBe("bounce");
    expect(inboundAutomationEventName("bounce")).toBe("email_bounce_detected");
  });

  it("classifies Auto-Submitted replies as auto replies", () => {
    expect(classifyInboundEmailAutomation({
      senderEmail: "person@example.com",
      subject: "Automatic Reply: Away",
      autoSubmitted: "auto-replied",
    })).toBe("auto_reply");
  });

  it("classifies bulk/list mail without treating normal replies as automated", () => {
    expect(classifyInboundEmailAutomation({ precedence: "bulk" })).toBe("bulk");
    expect(classifyInboundEmailAutomation({
      senderEmail: "client@example.com",
      subject: "Re: Casting brief",
      autoSubmitted: "no",
    })).toBeNull();
  });
});
