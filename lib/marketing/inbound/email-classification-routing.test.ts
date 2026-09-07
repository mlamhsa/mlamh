import { describe, expect, it } from "vitest";

import { classifyAndRouteInboundEmail } from "./email-classification-routing";

describe("inbound email classification and routing", () => {
  it("forces CEO review for commercial terms even if the model misses the flag", () => {
    expect(classifyAndRouteInboundEmail({
      analysis: { intent: "requirement_update", requires_ceo: false },
      content: "الميزانية 1500 ريال، هل يمكنكم تقديم خصم؟",
    })).toMatchObject({ classification: "commercial", route: "ceo_review", requiresCeo: true });
  });

  it("routes partnership and sponsorship signals to CEO review", () => {
    expect(classifyAndRouteInboundEmail({ content: "نرغب في شراكة ورعاية للحملة" }))
      .toMatchObject({ classification: "partnership", route: "ceo_review", requiresCeo: true });
  });

  it("keeps casting requirements with Dana", () => {
    expect(classifyAndRouteInboundEmail({ content: "نحتاج 3 مودلز في جدة للتصوير الأسبوع القادم" }))
      .toMatchObject({ classification: "casting", route: "dana", requiresCeo: false });
  });

  it("marks explicit opt-out for manual review instead of normal follow-up", () => {
    expect(classifyAndRouteInboundEmail({ content: "يرجى عدم التواصل معي مرة أخرى" }))
      .toMatchObject({ classification: "opt_out", route: "manual_review", requiresCeo: false });
  });
});
