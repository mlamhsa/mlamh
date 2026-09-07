export type EmailAutomationKind = "bounce" | "auto_reply" | "bulk" | null;

function clean(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function classifyInboundEmailAutomation(input: {
  senderEmail?: string | null;
  subject?: string | null;
  autoSubmitted?: string | null;
  precedence?: string | null;
}) : EmailAutomationKind {
  const sender = clean(input.senderEmail)?.toLowerCase() ?? "";
  const local = sender.split("@")[0] ?? "";
  const subject = clean(input.subject)?.toLowerCase() ?? "";
  const autoSubmitted = clean(input.autoSubmitted)?.toLowerCase() ?? "";
  const precedence = clean(input.precedence)?.toLowerCase() ?? "";

  if (
    /^(mailer-daemon|postmaster|bounce|bounces)$/i.test(local) ||
    /(?:delivery[ -]?status|delivery failure|undeliverable|returned mail|mail delivery failed|failure notice|تعذر التسليم|فشل التسليم)/iu.test(subject)
  ) {
    return "bounce";
  }

  if (
    (autoSubmitted && autoSubmitted !== "no") ||
    /^(auto-replied|auto-generated)$/i.test(autoSubmitted) ||
    /(?:out of office|automatic reply|auto reply|autoreply|vacation reply|رد تلقائي|خارج المكتب)/iu.test(subject) ||
    /^(no-?reply|do-?not-?reply)$/i.test(local)
  ) {
    return "auto_reply";
  }

  if (/^(bulk|list|junk)$/i.test(precedence)) return "bulk";
  return null;
}

export function inboundAutomationEventName(kind: Exclude<EmailAutomationKind, null>) {
  if (kind === "bounce") return "email_bounce_detected";
  if (kind === "auto_reply") return "email_auto_reply_detected";
  return "email_bulk_message_ignored";
}
