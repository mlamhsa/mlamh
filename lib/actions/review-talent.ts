"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function parseTalentId(formData: FormData): number {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid talent id.");
  }

  return id;
}

function revalidateTalentReviewPaths(id: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${id}`);

  revalidatePath("/ar/talents");
  revalidatePath("/en/talents");

  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/en/talent-dashboard");
}

async function updateTalentReviewStatus({
  id,
  status,
  published,
}: {
  id: number;
  status: "approved" | "rejected";
  published: boolean;
}) {
  await requireAdminAccess();

  const adminClient = createAdminClient();

  const { data: talent, error } = await adminClient
    .from("talents")
    .update({
      status,
      published,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `[updateTalentReviewStatus] ${error.message}`,
    );
  }

  if (!talent) {
    throw new Error("Talent not found.");
  }

  revalidateTalentReviewPaths(id);
}

export async function approveTalentAction(
  formData: FormData,
): Promise<void> {
  const id = parseTalentId(formData);

  await updateTalentReviewStatus({
    id,
    status: "approved",
    published: true,
  });
}

export async function rejectTalentAction(
  formData: FormData,
): Promise<void> {
  const id = parseTalentId(formData);

  await updateTalentReviewStatus({
    id,
    status: "rejected",
    published: false,
  });
}