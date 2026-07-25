import Image from "next/image";
import Link from "next/link";

import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type GalleryCardProps = {
  locale: string;
  imageUrl?: string | null;
  galleryImages?: string[] | string | null;
  maxImages?: number;
};

function GalleryIcon({
  name,
  className = "h-5 w-5",
}: {
  name: "image" | "arrow" | "check";
  className?: string;
}) {
  if (name === "arrow") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M5 12h14M14 7l5 5-5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={className}
        aria-hidden="true"
      >
        <path
          d="m6 12 4 4 8-8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="2.5"
      />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m5.5 17 4.5-4.5 3.2 3.2 2.2-2.2 3.1 3.5" />
    </svg>
  );
}

export default function GalleryCard({
  locale,
  imageUrl,
  galleryImages,
  maxImages = 20,
}: GalleryCardProps) {
  const isArabic = locale === "ar";

  const gallery = normalizeGalleryImages(galleryImages);

  const images = Array.from(
    new Set(
      [imageUrl, ...gallery].filter(
        (image): image is string =>
          typeof image === "string" &&
          image.trim().length > 0,
      ),
    ),
  );

  const previewImages = images.slice(0, 6);
  const remainingImages = Math.max(
    images.length - previewImages.length,
    0,
  );

  const progress =
    maxImages > 0
      ? Math.min(
          100,
          Math.round((images.length / maxImages) * 100),
        )
      : 0;

  const galleryHref = `/${locale}/talent-dashboard/gallery`;

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.07] text-gold">
            <GalleryIcon name="image" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isArabic ? "معرض الأعمال" : "Portfolio Gallery"}
            </p>

            <h2 className="mt-2 text-2xl font-light text-white">
              {isArabic ? "صورك وأعمالك" : "Your Images and Work"}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-7 text-white/45">
              {isArabic
                ? "اعرض أفضل صورك وحدد الصورة الرئيسية التي تظهر للناشرين والشركات."
                : "Showcase your best images and choose the main image shown to publishers and companies."}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
            {isArabic ? "إجمالي الصور" : "Total Images"}
          </p>

          <p className="mt-1 text-2xl font-light text-white">
            {images.length}
            <span className="ms-1 text-sm text-white/30">
              / {maxImages}
            </span>
          </p>
        </div>
      </div>

      {images.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previewImages.map((image, index) => {
              const isMainImage = image === imageUrl;
              const showsRemainingCount =
                remainingImages > 0 &&
                index === previewImages.length - 1;

              return (
                <div
                  key={image}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-black"
                >
                  <Image
                    src={image}
                    alt={
                      isArabic
                        ? `صورة المعرض ${index + 1}`
                        : `Gallery image ${index + 1}`
                    }
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 50vw, 220px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />

                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                    aria-hidden="true"
                  />

                  {isMainImage ? (
                    <span className="absolute bottom-2 start-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-black/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-sm">
                      <GalleryIcon
                        name="check"
                        className="h-3 w-3"
                      />

                      {isArabic ? "الرئيسية" : "Main"}
                    </span>
                  ) : null}

                  {showsRemainingCount ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
                      <span className="text-2xl font-light text-white">
                        +{remainingImages}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4 text-xs text-white/35">
              <span>
                {isArabic ? "سعة المعرض" : "Gallery Capacity"}
              </span>

              <span>
                {images.length} / {maxImages}
              </span>
            </div>

            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label={
                isArabic
                  ? "نسبة استخدام معرض الصور"
                  : "Gallery capacity usage"
              }
              aria-valuemin={0}
              aria-valuemax={maxImages}
              aria-valuenow={Math.min(
                images.length,
                maxImages,
              )}
            >
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
            <GalleryIcon name="image" />
          </div>

          <h3 className="mt-4 text-lg font-light text-white">
            {isArabic
              ? "معرضك ما زال فارغًا"
              : "Your gallery is empty"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/40">
            {isArabic
              ? "أضف صورًا احترافية تساعد الناشرين والشركات على اكتشاف أعمالك."
              : "Add professional images that help publishers and companies discover your work."}
          </p>
        </div>
      )}

      <Link
        href={galleryHref}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/35 bg-gold/[0.06] px-5 py-3.5 text-xs text-gold transition hover:border-gold/60 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <span>
          {images.length > 0
            ? isArabic
              ? "إدارة معرض الأعمال"
              : "Manage Gallery"
            : isArabic
              ? "إضافة صور إلى المعرض"
              : "Add Gallery Images"}
        </span>

        <span className={isArabic ? "rotate-180" : ""}>
          <GalleryIcon
            name="arrow"
            className="h-4 w-4"
          />
        </span>
      </Link>
    </section>
  );
}