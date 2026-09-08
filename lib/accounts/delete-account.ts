import { createAdminClient } from "@/lib/supabase/admin";
import { TALENT_GALLERY_BUCKET } from "@/lib/talents/talent-media-signing";

async function removeTalentStorage(talentId: number) {
  const supabase = createAdminClient();
  const folder = String(talentId);
  const { data, error } = await supabase.storage.from(TALENT_GALLERY_BUCKET).list(folder, { limit: 1000 });
  if (error) return { ok: false as const, code: "STORAGE_LIST_FAILED" as const };
  const paths = (data ?? []).filter((item) => item.name && item.name !== ".emptyFolderPlaceholder").map((item) => `${folder}/${item.name}`);
  if (!paths.length) return { ok: true as const };
  const { error: removeError } = await supabase.storage.from(TALENT_GALLERY_BUCKET).remove(paths);
  if (removeError) return { ok: false as const, code: "STORAGE_DELETE_FAILED" as const };
  return { ok: true as const };
}

export async function deleteMlamhAccount(userId: string) {
  const supabase = createAdminClient();

  const [{ data: profile, error: profileError }, { data: talent, error: talentError }] = await Promise.all([
    supabase.from("profiles").select("id,account_type").eq("user_id", userId).maybeSingle(),
    supabase.from("talents").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileError || talentError) return { ok: false as const, code: "LOOKUP_FAILED" as const };

  let publisherId: number | null = null;
  if (profile?.id) {
    const { data: publisher, error: publisherError } = await supabase.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
    if (publisherError) return { ok: false as const, code: "LOOKUP_FAILED" as const };
    publisherId = publisher?.id == null ? null : Number(publisher.id);
  }

  if (talent?.id != null) {
    const storageResult = await removeTalentStorage(Number(talent.id));
    if (!storageResult.ok) return storageResult;
  }

  if (publisherId != null) {
    const { error } = await supabase.from("opportunities").delete().eq("publisher_id", publisherId);
    if (error) return { ok: false as const, code: "DATA_DELETE_FAILED" as const };
  }

  const deletionSteps: Array<PromiseLike<{ error: unknown }>> = [
    supabase.from("talent_privacy_history").delete().eq("user_id", userId),
    supabase.from("marketing_events").delete().eq("user_id", userId),
    supabase.from("marketing_approvals").delete().eq("requested_by_user_id", userId),
    supabase.from("marketing_approvals").delete().eq("decision_by_user_id", userId),
    supabase.from("user_roles").delete().eq("user_id", userId),
    supabase.from("talents").delete().eq("user_id", userId),
    supabase.from("profiles").delete().eq("user_id", userId),
  ];

  for (const step of deletionSteps) {
    const { error } = await step;
    if (error) return { ok: false as const, code: "DATA_DELETE_FAILED" as const };
  }

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  if (authDeleteError) return { ok: false as const, code: "AUTH_DELETE_FAILED" as const };

  return { ok: true as const };
}
