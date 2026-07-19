"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type PublicTalentGalleryProps = {
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  alt: string;
  locale?: "ar" | "en";
};

export function PublicTalentGallery({
  imageUrl,
  galleryImages,
  alt,
  locale = "ar",
}: PublicTalentGalleryProps) {
  const isRtl = locale === "ar";

  const images = useMemo(() => {
    const gallery = normalizeGalleryImages(galleryImages);
    const main = imageUrl ? [imageUrl] : [];

    return Array.from(new Set([...main, ...gallery])).filter(Boolean);
  }, [imageUrl, galleryImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === images.length - 1 ? 0 : current + 1
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === 0 ? images.length - 1 : current - 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, isLightboxOpen]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[1.5rem] bg-black px-4 text-center text-xs uppercase tracking-[0.2em] text-gray-muted sm:aspect-[3/4]">
        {isRtl ? "لا توجد صورة" : "No image"}
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  return (
    <>
      <div className="w-full">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-black text-start sm:aspect-[3/4] sm:rounded-[2rem]"
          aria-label={
            isRtl ? "فتح الصورة بالحجم الكامل" : "Open image fullscreen"
          }
        >
          <Image
            src={activeImage}
            alt={alt}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/10 to-transparent p-4 pt-16">
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] text-white/75 backdrop-blur">
              {activeIndex + 1} / {images.length}
            </span>

            <span className="text-[10px] text-white/60">
              {isRtl ? "عرض كامل" : "Fullscreen"}
            </span>
          </div>
        </button>

        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-xl border transition sm:w-[84px] ${
                    isActive
                      ? "border-gold ring-1 ring-gold/30"
                      : "border-white/[0.08] opacity-65 hover:border-white/30 hover:opacity-100"
                  }`}
                  aria-label={
                    isRtl
                      ? `عرض الصورة ${index + 1}`
                      : `Show image ${index + 1}`
                  }
                >
                  <Image
                    src={image}
                    alt={`${alt} ${index + 1}`}
                    fill
                    sizes="84px"
                    className="object-contain"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={isRtl ? "عارض صور الموهبة" : "Talent image viewer"}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xl text-white transition hover:border-gold/40 hover:text-gold sm:end-7 sm:top-7"
            aria-label={isRtl ? "إغلاق" : "Close"}
          >
            ×
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute start-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xl text-white transition hover:border-gold/40 hover:text-gold sm:start-7"
                aria-label={isRtl ? "الصورة السابقة" : "Previous image"}
              >
                {isRtl ? "›" : "‹"}
              </button>

              <button
                type="button"
                onClick={showNext}
                className="absolute end-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xl text-white transition hover:border-gold/40 hover:text-gold sm:end-7"
                aria-label={isRtl ? "الصورة التالية" : "Next image"}
              >
                {isRtl ? "‹" : "›"}
              </button>
            </>
          ) : null}

<div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-black/40">
  <Image
    src={activeImage}
    alt={alt}
    fill
    priority={activeIndex === 0}
    sizes="(max-width: 1024px) 100vw, 520px"
    className="object-contain"
  />
</div>

          <div className="absolute bottom-4 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-xs text-white/70 sm:bottom-7">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      ) : null}
    </>
  );
}
