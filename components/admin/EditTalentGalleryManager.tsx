"use client";

import Image from "next/image";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { addTalentGalleryImagesAction } from "@/lib/actions/add-talent-gallery-images";
import { deleteTalentGalleryImageAction } from "@/lib/actions/delete-talent-gallery-image";
import { setTalentMainImageAction } from "@/lib/actions/set-talent-main-image";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

const BUCKET_NAME = "talent-images";
const MAX_UPLOAD_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type Props = {
  talentId: number;
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  alt: string;
};

function getExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return null;
}

export function EditTalentGalleryManager({
  talentId,
  imageUrl,
  galleryImages,
  alt,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const gallery = normalizeGalleryImages(galleryImages);

  const images = Array.from(
    new Set([imageUrl, ...gallery].filter(Boolean))
  ) as string[];

  async function handleUpload() {
    setErrorMessage(null);

    if (files.length === 0) {
      setErrorMessage("Please choose at least one image.");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const selectedFiles = files.slice(0, MAX_UPLOAD_IMAGES);
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error("Each image must be 5MB or smaller.");
        }

        const extension = getExtension(file.type);

        if (!extension) {
          throw new Error("Only JPG, PNG, WEBP, and AVIF images are allowed.");
        }

        const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const filePath = `talents/${fileName}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type,
          });

        if (error) {
          throw new Error(error.message);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const formData = new FormData();
      formData.append("talentId", String(talentId));

      for (const url of uploadedUrls) {
        formData.append("imageUrls", url);
      }

      await addTalentGalleryImagesAction(formData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upload failed."
      );
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <label className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
          Add gallery images
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
          }}
          className="w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold"
        />

        {errorMessage ? (
          <p className="mt-3 text-sm text-red-300">{errorMessage}</p>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-2 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload images"}
        </button>
      </div>

      {images.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-8 text-center text-sm text-gray-muted">
          No images available.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {images.map((image, index) => {
            const isMainImage = image === imageUrl;

            return (
              <div
                key={`${image}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
              >
                <div className="relative aspect-[3/4] bg-black">
                  <Image
                    src={image}
                    alt={`${alt} ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 50vw, 260px"
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3 border-t border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-white/50">
                      {isMainImage ? "Main image" : `Gallery ${index}`}
                    </p>

                    {!isMainImage ? (
                      <button
                        type="submit"
                        formAction={async () => {
                          const formData = new FormData();
                          formData.append("talentId", String(talentId));
                          formData.append("imageUrl", image);
                          await deleteTalentGalleryImageAction(formData);
                        }}
                        className="rounded-full border border-red-500/30 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-950/30"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-white/30">
                        Active
                      </span>
                    )}
                  </div>

                  {!isMainImage ? (
                    <button
                      type="submit"
                      formAction={async () => {
                        const formData = new FormData();
                        formData.append("talentId", String(talentId));
                        formData.append("imageUrl", image);
                        await setTalentMainImageAction(formData);
                      }}
                      className="w-full rounded-full border border-gold/30 px-3 py-2 text-[9px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                    >
                      Set as main
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}