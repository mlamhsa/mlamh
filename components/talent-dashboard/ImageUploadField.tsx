"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
};

export function ImageUploadField({
  name,
  label,
  defaultValue,
  required = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setUploading(true);

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `profile-images/${crypto.randomUUID()}.${extension}`;

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

      setImageUrl(data.publicUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload image."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={imageUrl} />

      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        {imageUrl ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={label}
              className="h-64 w-full object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-gold/40 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : imageUrl
                ? "Change Image"
                : "Upload Image"}
          </button>

          {imageUrl ? (
            <button
              type="button"
              onClick={() => {
                if (!required) {
                  setImageUrl("");
                  return;
                }

                setError("This image is required.");
              }}
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/50 transition hover:border-white/30 hover:text-white"
            >
              Remove
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void uploadImage(file);
            }

            event.target.value = "";
          }}
        />

        {error ? (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        ) : (
          <p className="mt-3 text-xs leading-6 text-gray-muted">
            JPG, PNG, or WebP. Maximum size 5MB.
          </p>
        )}
      </div>
    </div>
  );
}