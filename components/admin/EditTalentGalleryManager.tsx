"use client";

import Image from "next/image";
import { addTalentGalleryImagesAction } from "@/lib/actions/add-talent-gallery-images";
import { deleteTalentGalleryImageAction } from "@/lib/actions/delete-talent-gallery-image";
import { setTalentMainImageAction } from "@/lib/actions/set-talent-main-image";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type EditTalentGalleryManagerProps = {
  talentId: number;
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  alt: string;
};

export function EditTalentGalleryManager({
  talentId,
  imageUrl,
  galleryImages,
  alt,
}: EditTalentGalleryManagerProps) {
  const gallery = normalizeGalleryImages(galleryImages);
  const images = Array.from(
    new Set([imageUrl, ...gallery].filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <label className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
          Add gallery images
        </label>

        <input
          name="gallery"
          type="file"
          accept="image/*"
          multiple
          className="w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold"
        />

        <button
          type="submit"
          formAction={async (formData) => {
            formData.append("talentId", String(talentId));
            await addTalentGalleryImagesAction(formData);
          }}
          className="mt-4 rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-2 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
        >
          Upload images
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
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 768px) 50vw, 260px"
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3 border-t border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-white/50">
                      {isMainImage ? "Main image" : `Gallery ${index}`}
                    </p>

                    {isMainImage ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-white/30">
                        Active
                      </span>
                    ) : (
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