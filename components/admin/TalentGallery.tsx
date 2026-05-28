"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type TalentGalleryProps = {
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  alt: string;
};

export function TalentGallery({
  imageUrl,
  galleryImages,
  alt,
}: TalentGalleryProps) {
  const images = useMemo(() => {
    const gallery = normalizeGalleryImages(galleryImages);
    const main = imageUrl ? [imageUrl] : [];

    return Array.from(new Set([...main, ...gallery])).filter(Boolean);
  }, [imageUrl, galleryImages]);

  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-black px-4 text-center text-xs uppercase tracking-[0.25em] text-gray-muted">
        No image
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="w-full">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black">
        <Image
          src={activeImage}
          alt={alt}
          fill
          loading={activeIndex === 0 ? "eager" : "lazy"}
          sizes="(max-width: 768px) 220px, 260px"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-md border transition ${
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
                  sizes="64px"
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