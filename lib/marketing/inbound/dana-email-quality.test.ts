import { describe, expect, it } from "vitest";

import {
  applyDanaInboundEmailQualityGuard,
  hasUnexpectedCjk,
  inboundBudgetBasisIsAmbiguous,
} from "./dana-email-quality";

describe("Dana inbound email quality guard", () => {
  it("detects unexpected CJK output", () => {
    expect(hasUnexpectedCjk("المرسل不是我 العميل الأصلي")).toBe(true);
    expect(hasUnexpectedCjk("العميل طلب 3 مودلز في جدة")).toBe(false);
  });

  it("treats a budget without total/per-model basis as ambiguous", () => {
    expect(inboundBudgetBasisIsAmbiguous("الميزانية 1500 ريال لليوم")).toBe(true);
    expect(inboundBudgetBasisIsAmbiguous("الميزانية الإجمالية 1500 ريال لليوم")).toBe(false);
    expect(inboundBudgetBasisIsAmbiguous("1500 ريال لكل مودل")).toBe(false);
  });

  it("sanitizes CJK and forces ambiguous budget basis to unspecified", () => {
    const result = applyDanaInboundEmailQualityGuard({
      inboundContent: "أحتاج 3 مودلز والميزانية 1500 ريال لليوم",
      analysis: {
        executive_summary: "المرسل不是我 العميل الأصلي",
        reply_draft: "تم تحديث الطلب. هل الميزانية إجمالية أم لكل مودل؟",
        updated_requirements: {
          budget: { current: "1500 SAR total per day" },
        },
      },
    });

    expect(result.executive_summary).toBe("المرسل العميل الأصلي");
    expect(result.updated_requirements).toEqual({
      budget: { current: "1500 SAR total per day", basis: "unspecified" },
    });
    expect(result.quality_flags).toEqual(expect.arrayContaining(["unexpected_cjk_removed", "budget_basis_ambiguous"]));
  });
});
