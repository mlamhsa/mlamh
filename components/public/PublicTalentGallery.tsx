"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type PublicTalentGalleryProps = {
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  alt: string;
  locale?: "ar" | "en";
};

const SWIPE_THRESHOLD = 45;

export function PublicTalentGallery({
  imageUrl,
  galleryImages,
  alt,
  locale = "ar",
}: PublicTalentGalleryProps) {
  const isRtl = locale === "ar";

  const images = useMemo(() => {
    const gallery = normalizeGalleryImages(galleryImages);
    const main = imageUrl?.trim() ? [imageUrl.trim()] : [];

    return Array.from(
      new Set([...main, ...gallery].filter(Boolean)),
    );
  }, [galleryImages, imageUrl]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activeImage = images[activeIndex] ?? images[0];

  function showPrevious() {
    if (images.length <= 1) {
      return;
    }

    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNext() {
    if (images.length <= 1) {
      return;
    }

    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
    touchEndX.current = null;
  }

  function handleTouchMove(clientX: number) {
    touchEndX.current = clientX;
  }

  function handleTouchEnd() {
    if (
      touchStartX.current === null ||
      touchEndX.current === null
    ) {
      return;
    }

    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      return;
    }

    if (distance > 0) {
      showNext();
    } else {
      showPrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, images.length]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (event.key === "ArrowRight") {
        showNext();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[1.35rem] border border-white/10 bg-black/45 px-6 text-center text-xs text-white/35 sm:rounded-[2rem]">
        {isRtl ? "لا توجد صور متاحة" : "No images available"}
      </div>
    );
  }

  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <>
      <div className="w-full min-w-0">
        <div
          className="group relative aspect-[4/5] w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/70 sm:aspect-[3/4] sm:rounded-[2rem]"
          onTouchStart={(event) =>
            handleTouchStart(event.touches[0]?.clientX ?? 0)
          }
          onTouchMove={(event) =>
            handleTouchMove(event.touches[0]?.clientX ?? 0)
          }
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 z-10 block cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/80"
            aria-label={
              isRtl
                ? "فتح الصورة بالحجم الكامل"
                : "Open image fullscreen"
            }
          />

          <Image
            src={activeImage}
            alt={alt}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-contain"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 p-3 sm:p-4">
            <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] text-white/75 backdrop-blur-md">
              {activeIndex + 1} / {images.length}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] text-white/65 backdrop-blur-md">
              <Maximize2 size={12} aria-hidden="true" />
              {isRtl ? "عرض كامل" : "Fullscreen"}
            </span>
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute start-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-md transition hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                aria-label={
                  isRtl ? "الصورة السابقة" : "Previous image"
                }
              >
                <PreviousIcon size={19} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={showNext}
                className="absolute end-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-md transition hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                aria-label={
                  isRtl ? "الصورة التالية" : "Next image"
                }
              >
                <NextIcon size={19} aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div
            className="mt-3 flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label={
              isRtl ? "صور الموهبة المصغرة" : "Talent thumbnails"
            }
          >
            {images.map((image, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  role="listitem"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-[74px] w-[62px] shrink-0 overflow-hidden rounded-xl border bg-black/60 transition sm:h-[88px] sm:w-[74px] ${
                    isActive
                      ? "border-gold ring-2 ring-gold/20"
                      : "border-white/10 opacity-65 hover:border-white/30 hover:opacity-100"
                  }`}
                  aria-current={isActive ? "true" : undefined}
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
                    sizes="74px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-3 py-16 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={isRtl ? "عارض صور الموهبة" : "Talent image viewer"}
          onTouchStart={(event) =>
            handleTouchStart(event.touches[0]?.clientX ?? 0)
          }
          onTouchMove={(event) =>
            handleTouchMove(event.touches[0]?.clientX ?? 0)
          }
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute end-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white transition hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 sm:end-7 sm:top-7"
            aria-label={isRtl ? "إغلاق" : "Close"}
          >
            <X size={21} aria-hidden="true" />
          </button>

          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image
              src={activeImage}
              alt={alt}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute start-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white transition hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 sm:start-7"
                aria-label={
                  isRtl ? "الصورة السابقة" : "Previous image"
                }
              >
                <PreviousIcon size={22} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={showNext}
                className="absolute end-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white transition hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 sm:end-7"
                aria-label={
                  isRtl ? "الصورة التالية" : "Next image"
                }
              >
                <NextIcon size={22} aria-hidden="true" />
              </button>
            </>
          ) : null}

          <div className="absolute bottom-5 start-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/65 px-4 py-2 text-xs text-white/75 backdrop-blur-md sm:bottom-7">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      ) : null}
    </>
  );
}
