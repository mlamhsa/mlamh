import { createAdminClient } from "@/lib/supabase/admin";

export async function editPendingInvestorOutreach({
  outreachId,
  userId,
  subject,
  bodyText,
}: {
  outreachId: number;
  userId: string;
  subject: string;
  bodyText: string;
}) {
  const cleanSubject = subject.trim().slice(0, 300);
  const cleanBody = bodyText.trim().slice(0, 12000);
  if (!cleanSubject) throw new Error("Email subject is required.");
  if (cleanBody.length < 20) throw new Error("Email body is too short.");

  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("investor_outreach")
    .update({
      subject: cleanSubject,
      body_text: cleanBody,
      updated_at: now,
    })
    .eq("id", outreachId)
    .eq("status", "pending_approval")
    .select("id,investor_id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Only a pending investor outreach draft can be edited.");
  }

  await db.from("investor_activity").insert({
    investor_id: data.investor_id,
    outreach_id: outreachId,
    action: "outreach_edited_by_admin",
    actor_type: "admin",
    actor_user_id: userId,
    summary: "Investor outreach subject/body edited before approval.",
  });

  return data;
}
