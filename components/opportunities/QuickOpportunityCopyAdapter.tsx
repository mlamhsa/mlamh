"use client";

import { useEffect } from "react";

const AR_REPLACEMENTS = new Map([
  ["التقديم على الفرصة", "مهتم"],
  ["جاهز للتقديم؟", "مهتم بهذا الطلب؟"],
  ["راجع التفاصيل ثم أرسل طلبك عندما تكون مستعدًا.", "راجع التفاصيل، ثم أبدِ اهتمامك إذا كان الطلب مناسبًا لك."],
  ["التقديم مجاني عبر منصة ملامح.", "إبداء الاهتمام مجاني عبر منصة ملامح."],
  ["يتم إرسال ملفك المهني إلى الجهة مباشرة.", "يمكن للناشر الاطلاع على ملفك والتواصل معك داخل ملامح."],
  ["يمكنك متابعة حالة الطلب من صفحة طلباتي.", "يمكنك متابعة اهتمامك والمحادثة من صفحة طلباتي."],
  ["تأكد من اكتمال ملفك وصورك قبل إرسال الطلب.", "تأكد من اكتمال ملفك قبل إبداء الاهتمام."],
  ["متاح للتقديم", "متاح للاهتمام"],
]);

const EN_REPLACEMENTS = new Map([
  ["Apply for Opportunity", "I'm Interested"],
  ["Ready to apply?", "Interested in this request?"],
  ["Review the details, then submit your application when ready.", "Review the details, then express interest if this request fits you."],
  ["Applying is free through MLAMH.", "Expressing interest is free through MLAMH."],
  ["Your professional profile is sent directly to the publisher.", "The publisher can review your profile and contact you inside MLAMH."],
  ["You can track your application status from My Applications.", "You can track your interest and conversation from My Requests."],
  ["Make sure your profile and photos are complete before submitting.", "Make sure your profile is complete before expressing interest."],
  ["Open for applications", "Open for interest"],
]);

function replaceText(root: ParentNode, replacements: Map<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const value = node.nodeValue?.trim();
    if (value && replacements.has(value)) {
      const replacement = replacements.get(value);
      if (replacement) node.nodeValue = node.nodeValue?.replace(value, replacement) ?? replacement;
    }
    node = walker.nextNode();
  }
}

export default function QuickOpportunityCopyAdapter({
  enabled,
  locale,
}: {
  enabled: boolean;
  locale: string;
}) {
  useEffect(() => {
    if (!enabled) return;

    const replacements = locale === "ar" ? AR_REPLACEMENTS : EN_REPLACEMENTS;
    const apply = () => replaceText(document.body, replacements);

    apply();

    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [enabled, locale]);

  return null;
}
