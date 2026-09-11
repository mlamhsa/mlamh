"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "casting-project-files";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_CATEGORIES = new Set(["general", "call_sheet", "brief", "reference", "contract", "invoice", "deliverable", "other"]);
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_EXTENSIONS: Record<string, ReadonlySet<string>> = {
  "application/pdf": new Set(["pdf"]),
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "application/msword": new Set(["doc"]),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": new Set(["docx"]),
  "application/vnd.ms-excel": new Set(["xls"]),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": new Set(["xlsx"]),
};

function positiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Invalid id.");
  return parsed;
}

function cleanName(name: string) {
  const normalized = name.normalize("NFKC").replace(/[\\/\0]/g, "-").replace(/\s+/g, " ").trim();
  return (normalized || "file").slice(0, 180);
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function startsWithBytes(buffer: Buffer, signature: readonly number[]) {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function hasZipSignature(buffer: Buffer) {
  return (
    startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

function hasOleSignature(buffer: Buffer) {
  return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function containsAscii(buffer: Buffer, value: string) {
  return buffer.indexOf(Buffer.from(value, "ascii")) !== -1;
}

function hasExpectedSignature(mimeType: string, buffer: Buffer) {
  switch (mimeType) {
    case "application/pdf":
      return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case "image/jpeg":
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "application/msword":
    case "application/vnd.ms-excel":
      return hasOleSignature(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return hasZipSignature(buffer) && containsAscii(buffer, "[Content_Types].xml") && containsAscii(buffer, "word/");
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return hasZipSignature(buffer) && containsAscii(buffer, "[Content_Types].xml") && containsAscii(buffer, "xl/");
    default:
      return false;
  }
}

async function projectContext(projectId: number) {
  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("casting_projects")
    .select("id,service_mode,client_access_token")
    .eq("id", projectId)
    .maybeSingle();
  if (error || !project || project.service_mode !== "managed") throw new Error("Managed casting project not found.");
  return project;
}

function refresh(projectId: number, token?: string | null) {
  revalidatePath(`/admin/casting/${projectId}`);
  revalidatePath(`/admin/casting/${projectId}/files`);
  if (token) {
    revalidatePath(`/ar/casting/status/${token}`);
    revalidatePath(`/en/casting/status/${token}`);
  }
}

export async function uploadCastingProjectFileAction(formData: FormData) {
  const adminUser = await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const project = await projectContext(projectId);
  const rawCategory = String(formData.get("category") || "general");
  const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : "general";
  const visibleToClient = formData.get("visible_to_client") !== "false";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) throw new Error("A file is required.");
  if (file.size > MAX_BYTES) throw new Error("File exceeds the 20 MB limit.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Unsupported file type.");

  const fileName = cleanName(file.name);
  const extension = extensionOf(fileName);
  const allowedExtensions = ALLOWED_EXTENSIONS[file.type];
  if (!extension || !allowedExtensions?.has(extension)) {
    throw new Error("File extension does not match the declared file type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length !== file.size || !hasExpectedSignature(file.type, buffer)) {
    throw new Error("File signature does not match the declared file type.");
  }

  const admin = createAdminClient();
  const storagePath = `${projectId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await admin.from("casting_project_files").insert({
    casting_project_id: projectId,
    file_name: fileName,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    category,
    visible_to_client: visibleToClient,
    uploaded_by: adminUser.id,
  });
  if (insertError) {
    await admin.storage.from(BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  refresh(projectId, project.client_access_token);
}

export async function updateCastingProjectFileVisibilityAction(formData: FormData) {
  await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const fileId = positiveInt(formData.get("file_id"));
  const project = await projectContext(projectId);
  const visibleToClient = formData.get("visible_to_client") === "true";
  const admin = createAdminClient();
  const { error } = await admin.from("casting_project_files")
    .update({ visible_to_client: visibleToClient, updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .eq("casting_project_id", projectId);
  if (error) throw new Error(error.message);
  refresh(projectId, project.client_access_token);
}

export async function deleteCastingProjectFileAction(formData: FormData) {
  await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const fileId = positiveInt(formData.get("file_id"));
  const project = await projectContext(projectId);
  const admin = createAdminClient();
  const { data: row, error: lookupError } = await admin.from("casting_project_files")
    .select("id,storage_path")
    .eq("id", fileId)
    .eq("casting_project_id", projectId)
    .maybeSingle();
  if (lookupError || !row) throw new Error("Project file not found.");
  const { error: storageError } = await admin.storage.from(BUCKET).remove([row.storage_path]);
  if (storageError) throw new Error(storageError.message);
  const { error: deleteError } = await admin.from("casting_project_files").delete().eq("id", row.id);
  if (deleteError) throw new Error(deleteError.message);
  refresh(projectId, project.client_access_token);
}
