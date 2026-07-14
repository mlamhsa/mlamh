"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ServerAction = (formData: FormData) => void | Promise<void>;

type GallerySortableListProps = {
  images: string[];
  mainImageUrl: string | null;
  talentName: string | null;
  locale: string;
  reorderAction: ServerAction;
  setMainAction: ServerAction;
  removeAction: ServerAction;
};

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.filter(Boolean)));
}

function areArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

function GalleryActionIcon({
  name,
  className = "h-4 w-4",
}: {
  name: "drag" | "star" | "trash" | "save" | "image" | "check";
  className?: string;
}) {
  if (name === "drag") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="M8 7h8M8 12h8M8 17h8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4Z" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <path d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7" strokeLinecap="round" />
        <path d="M7 7l1 13h8l1-13" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "save") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <path d="M5 4h11l3 3v13H5V4Z" strokeLinejoin="round" />
        <path d="M8 4v6h8V4M8 20v-6h8v6" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="m6 12 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m5.5 17 4.5-4.5 3.2 3.2 2.2-2.2 3.1 3.5" />
    </svg>
  );
}

function SortableImageCard({
  imageUrl,
  index,
  isMain,
  talentName,
  isArabic,
  locale,
  setMainAction,
  removeAction,
}: {
  imageUrl: string;
  index: number;
  isMain: boolean;
  talentName: string | null;
  isArabic: boolean;
  locale: string;
  setMainAction: ServerAction;
  removeAction: ServerAction;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: imageUrl });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group overflow-hidden rounded-[1.5rem] border bg-white/[0.025] transition ${
        isDragging
          ? "z-20 scale-[0.985] border-gold/50 opacity-75 shadow-2xl shadow-black/50"
          : "border-white/10 hover:-translate-y-0.5 hover:border-gold/25"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black sm:aspect-[4/5]">
        <Image
          src={imageUrl}
          alt={talentName || (isArabic ? "صورة موهبة" : "Talent image")}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.035]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/5 to-black/25" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] tracking-[0.16em] text-white/70 backdrop-blur-md">
            #{index + 1}
          </span>

          {isMain ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/55 px-3 py-1 text-[10px] tracking-[0.14em] text-gold backdrop-blur-md">
              <GalleryActionIcon name="star" />
              {isArabic ? "الرئيسية" : "Main"}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute bottom-4 left-1/2 inline-flex min-h-10 -translate-x-1/2 cursor-grab items-center justify-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 text-xs text-white/75 backdrop-blur-md transition hover:border-gold/35 hover:text-gold active:cursor-grabbing"
          aria-label={isArabic ? "سحب لإعادة الترتيب" : "Drag to reorder"}
        >
          <GalleryActionIcon name="drag" />
          {isArabic ? "اسحب" : "Drag"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 sm:p-4">
        {!isMain ? (
          <form action={setMainAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="image_url" value={imageUrl} />

            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/[0.05] px-3 text-xs text-gold transition hover:bg-gold/10"
            >
              <GalleryActionIcon name="star" />
              {isArabic ? "الرئيسية" : "Set Main"}
            </button>
          </form>
        ) : (
          <div className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 text-xs text-emerald-200">
            <GalleryActionIcon name="check" />
            {isArabic ? "رئيسية" : "Main"}
          </div>
        )}

        <form action={removeAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="image_url" value={imageUrl} />

          <button
            type="submit"
            onClick={(event) => {
              const confirmed = window.confirm(
                isArabic
                  ? "هل أنت متأكد من حذف هذه الصورة؟"
                  : "Are you sure you want to remove this image?"
              );

              if (!confirmed) {
                event.preventDefault();
              }
            }}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-red-400/25 bg-red-400/[0.04] px-3 text-xs text-red-300 transition hover:bg-red-400/[0.08]"
          >
            <GalleryActionIcon name="trash" />
            {isArabic ? "حذف" : "Remove"}
          </button>
        </form>
      </div>
    </article>
  );
}

export function GallerySortableList({
  images,
  mainImageUrl,
  talentName,
  locale,
  reorderAction,
  setMainAction,
  removeAction,
}: GallerySortableListProps) {
  const isArabic = locale === "ar";
  const normalizedImages = useMemo(() => uniqueImages(images), [images]);

  const [mounted, setMounted] = useState(false);
  const [orderedImages, setOrderedImages] = useState<string[]>(normalizedImages);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOrderedImages(normalizedImages);
  }, [normalizedImages]);

  const hasUnsavedChanges = useMemo(
    () => !areArraysEqual(normalizedImages, orderedImages),
    [normalizedImages, orderedImages]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setOrderedImages((items) => {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) return items;

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  if (!mounted) return null;

  return (
    <section>
      <div className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isArabic ? "ترتيب المعرض" : "Gallery Order"}
            </p>

            <h2 className="mt-2 text-2xl font-light sm:text-3xl">
              {isArabic ? "رتّب صورك بالطريقة التي تريدها" : "Arrange Your Portfolio Images"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              {isArabic
                ? "اسحب الصور لتغيير ترتيب ظهورها في ملفك العام، ثم احفظ الترتيب الجديد."
                : "Drag images to change how they appear on your public profile, then save the new order."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/55">
              <GalleryActionIcon name="image" />
              {orderedImages.length}{" "}
              {isArabic
                ? orderedImages.length === 1
                  ? "صورة"
                  : "صور"
                : orderedImages.length === 1
                  ? "Image"
                  : "Images"}
            </div>

            <div
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs ${
                hasUnsavedChanges
                  ? "border-amber-300/20 bg-amber-300/[0.07] text-amber-200"
                  : "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200"
              }`}
            >
              {hasUnsavedChanges
                ? isArabic
                  ? "تغييرات غير محفوظة"
                  : "Unsaved Changes"
                : isArabic
                  ? "جميع التغييرات محفوظة"
                  : "All Changes Saved"}
            </div>
          </div>
        </div>

        {hasUnsavedChanges && orderedImages.length > 0 ? (
          <form action={reorderAction} className="mt-5">
            <input type="hidden" name="locale" value={locale} />
            <input
              type="hidden"
              name="ordered_images"
              value={JSON.stringify(orderedImages)}
            />

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold px-6 text-sm text-black transition hover:bg-gold-soft sm:w-auto"
            >
              <GalleryActionIcon name="save" />
              {isArabic ? "حفظ الترتيب" : "Save Order"}
            </button>
          </form>
        ) : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedImages} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orderedImages.map((imageUrl, index) => (
              <SortableImageCard
                key={imageUrl}
                imageUrl={imageUrl}
                locale={locale}
                index={index}
                isMain={imageUrl === mainImageUrl}
                talentName={talentName}
                isArabic={isArabic}
                setMainAction={setMainAction}
                removeAction={removeAction}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
