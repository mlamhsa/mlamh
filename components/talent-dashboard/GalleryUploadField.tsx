"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type GalleryUploadFieldProps = {
  name: string;
  label: string;
  defaultValue?: string[] | string | null;
  maxImages?: number;
};

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
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots);
    const maxSize = 5 * 1024 * 1024;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Please upload image files only.");
        }

        if (file.size > maxSize) {
          throw new Error("Each image must be less than 5MB.");
        }

        const extension = file.name.split(".").pop() || "jpg";
        const filePath = `gallery/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("talent-media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("talent-media")
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      setImages((current) => [...current, ...uploadedUrls]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload gallery images."
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
                  Remove
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
          {uploading ? "Uploading..." : "Upload Gallery Images"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
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
            Up to {maxImages} images. JPG, PNG, or WebP. Maximum 5MB each.
          </p>
        )}
      </div>
    </div>
  );
}