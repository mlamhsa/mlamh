"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type GalleryUploadFieldProps = {
  name: string;
  label: string;
  defaultValue?: string[] | string | null;
  maxImages?: number;
};

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function parseInitialImages(value?: string[] | string | null) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function GalleryUploadField({
  name,
  label,
  defaultValue,
  maxImages = 8,
}: GalleryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<string[]>(parseInitialImages(defaultValue));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImages(files: FileList) {
    setError("");

    const selectedFiles = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      setError(`الحد الأقصى ${maxImages} صور.`);
      return;
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots);
    const maxSize = 5 * 1024 * 1024;

    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token || !session.user?.id) {
        throw new Error("انتهت الجلسة. سجّل الدخول مرة أخرى ثم أعد المحاولة.");
      }

      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const extension = ALLOWED_IMAGE_TYPES.get(file.type);

        if (!extension) {
          throw new Error("الصيغ المسموحة فقط: JPG و PNG و WebP.");
        }

        if (file.size > maxSize) {
          throw new Error("يجب ألا يتجاوز حجم كل صورة 5 ميجابايت.");
        }

        let quarantinePath = `${session.user.id}/gallery/${crypto.randomUUID()}.${extension}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from("media-quarantine")
            .upload(quarantinePath, file, {
              cacheControl: "no-store",
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          const response = await fetch("/api/media/process", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: quarantinePath,
              kind: "gallery",
            }),
          });

          const result = (await response.json()) as {
            publicUrl?: string;
            error?: string;
          };

          if (!response.ok || !result.publicUrl) {
            throw new Error(
              result.error === "INVALID_IMAGE_SIGNATURE"
                ? "إحدى الملفات ليست صورة سليمة."
                : "تعذر فحص إحدى الصور وتجهيزها للنشر.",
            );
          }

          quarantinePath = "";
          uploadedUrls.push(result.publicUrl);
        } catch (imageError) {
          if (quarantinePath) {
            await supabase.storage.from("media-quarantine").remove([quarantinePath]);
          }
          throw imageError;
        }
      }

      setImages((current) => [...current, ...uploadedUrls]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "فشل رفع صور المعرض."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="md:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        {images.length > 0 ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="overflow-hidden rounded-xl border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${label} ${index + 1}`}
                  className="h-40 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  className="w-full border-t border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white/50 transition hover:text-white"
                >
                  إزالة
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          disabled={uploading || images.length >= maxImages}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-gold/40 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "جاري فحص الصور..." : "رفع صور المعرض"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files;

            if (files && files.length > 0) {
              void uploadImages(files);
            }

            event.target.value = "";
          }}
        />

        {error ? (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        ) : (
          <p className="mt-3 text-xs leading-6 text-gray-muted">
            حتى {maxImages} صور. JPG و PNG و WebP فقط، حتى 5 ميجابايت لكل صورة. يتم فحص كل صورة وإعادة بنائها قبل نشرها.
          </p>
        )}
      </div>
    </div>
  );
}
