"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type PublicTalentGalleryProps = {
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  alt: string;
};

export function PublicTalentGallery({
  imageUrl,
  galleryImages,
  alt,
}: PublicTalentGalleryProps) {
  const images = useMemo(() => {
    const gallery = normalizeGalleryImages(galleryImages);
    const main = imageUrl ? [imageUrl] : [];

    return Array.from(new Set([...main, ...gallery])).filter(Boolean);
  }, [imageUrl, galleryImages]);

  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-black px-4 text-center text-xs uppercase tracking-[0.25em] text-gray-muted">
        No image
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="w-full">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">
        <Image
          src={activeImage}
          alt={alt}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                  isActive
                    ? "border-gold"
                    : "border-white/[0.08] hover:border-white/30"
                }`}
                aria-label={`Show image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}