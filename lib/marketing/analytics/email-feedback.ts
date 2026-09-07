import { createAdminClient } from "@/lib/supabase/admin";

export type EmailFeedbackDiagnosis =
  | "insufficient_sample"
  | "deliverability_attention"
  | "messaging_or_targeting_attention"
  | "review_followups"
  | "healthy_observation";

export function diagnoseEmailFeedback(input: {
  published: number;
  humanInbound: number;
  bounces: number;
  followUpsDue: number;
}) : EmailFeedbackDiagnosis {
  if (input.published < 5) return "insufficient_sample";
  const bounceRate = input.published > 0 ? input.bounces / input.published : 0;
  const replyRate = input.published > 0 ? input.humanInbound / input.published : 0;
  if (bounceRate >= 0.1) return "deliverability_attention";
  if (input.published >= 10 && replyRate < 0.1) return "messaging_or_targeting_attention";
  if (input.followUpsDue > 0) return "review_followups";
  return "healthy_observation";
}

export async function getEmailFeedbackSnapshot({ days = 30 }: { days?: number } = {}) {
  const db = createAdminClient();
  const safeDays = Math.max(1, Math.min(days, 90));
  const since = new Date(Date.now() - safeDays * 86400000).toISOString();

  const [publishedResult, inboundResult, bounceResult, autoReplyResult, followUpResult, classifiedResult, ceoRouteResult] = await Promise.all([
    db.from("marketing_channel_jobs")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .eq("status", "published")
      .gte("published_at", since),
    db.from("marketing_messages")
      .select("id", { count: "exact", head: true })
      .eq("direction", "inbound")
      .eq("message_type", "email")
      .gte("received_at", since),
    db.from("marketing_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "email_bounce_detected")
      .gte("occurred_at", since),
    db.from("marketing_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "email_auto_reply_detected")
      .gte("occurred_at", since),
    db.from("marketing_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "email_follow_up_due")
      .gte("occurred_at", since),
    db.from("marketing_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "email_inbound_classified")
      .gte("occurred_at", since),
    db.from("marketing_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "email_inbound_classified")
      .contains("metadata", { route: "ceo_review" })
      .gte("occurred_at", since),
  ]);

  const published = publishedResult.count ?? 0;
  const humanInbound = inboundResult.count ?? 0;
  const bounces = bounceResult.count ?? 0;
  const autoReplies = autoReplyResult.count ?? 0;
  const followUpsDue = followUpResult.count ?? 0;
  const classified = classifiedResult.count ?? 0;
  const ceoRouted = ceoRouteResult.count ?? 0;
  const observedReplyRate = published > 0 ? Math.round((humanInbound / published) * 1000) / 10 : 0;
  const observedBounceRate = published > 0 ? Math.round((bounces / published) * 1000) / 10 : 0;
  const diagnosis = diagnoseEmailFeedback({ published, humanInbound, bounces, followUpsDue });

  return {
    enabled: true,
    windowDays: safeDays,
    since,
    published,
    humanInbound,
    bounces,
    autoReplies,
    followUpsDue,
    classified,
    ceoRouted,
    observedReplyRate,
    observedBounceRate,
    diagnosis,
    note: "Observed rates are operational indicators from recorded email jobs/messages in the selected window, not strict campaign attribution.",
  };
}
