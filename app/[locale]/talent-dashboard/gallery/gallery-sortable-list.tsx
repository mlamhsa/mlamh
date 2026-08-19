"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
  talentName: string | null;
  locale: string;
  reorderAction: ServerAction;
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
  name:
    | "drag"
    | "trash"
    | "save"
    | "image"
    | "up"
    | "down";
  className?: string;
}) {
  if (name === "drag") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="M8 7h8M8 12h8M8 17h8" strokeLinecap="round" />
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

  if (name === "up") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="m7 14 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "down") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
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
  talentName,
  isArabic,
  locale,
  isFirst,
  isLast,
  moveUp,
  moveDown,
  removeAction,
}: {
  imageUrl: string;
  index: number;
  talentName: string | null;
  isArabic: boolean;
  locale: string;
  isFirst: boolean;
  isLast: boolean;
  moveUp: () => void;
  moveDown: () => void;
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

        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute bottom-4 left-1/2 inline-flex min-h-12 min-w-[150px] -translate-x-1/2 touch-none cursor-grab items-center justify-center gap-2 rounded-full border border-white/15 bg-black/70 px-5 text-sm text-white/80 backdrop-blur-md transition hover:border-gold/35 hover:text-gold active:cursor-grabbing"
          aria-label={isArabic ? "سحب لإعادة الترتيب" : "Drag to reorder"}
        >
          <GalleryActionIcon name="drag" />
          {isArabic ? "اسحب" : "Drag"}
        </button>
      </div>

      <div className="p-3 sm:p-4">
  
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
        <div className="mt-3 grid grid-cols-2 gap-3 sm:hidden">
          <button
            type="button"
            onClick={moveUp}
            disabled={isFirst}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/65 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            <GalleryActionIcon name="up" />
            {isArabic ? "للأعلى" : "Move Up"}
          </button>

          <button
            type="button"
            onClick={moveDown}
            disabled={isLast}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/65 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            <GalleryActionIcon name="down" />
            {isArabic ? "للأسفل" : "Move Down"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function GallerySortableList({
  images,
  talentName,
  locale,
  reorderAction,
  removeAction,
}: GallerySortableListProps) {
  const isArabic = locale === "ar";

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const normalizedImages = useMemo(() => uniqueImages(images), [images]);
  const normalizedImagesKey = useMemo(
    () => JSON.stringify(normalizedImages),
    [normalizedImages],
  );

  const [galleryState, setGalleryState] = useState<{
    sourceKey: string;
    orderedImages: string[];
  }>(() => ({
    sourceKey: normalizedImagesKey,
    orderedImages: normalizedImages,
  }));

  /*
   * عند تغيّر الصور القادمة من الخادم نعرض النسخة الجديدة مباشرة،
   * من دون نسخ props إلى state داخل useEffect.
   */
  const orderedImages =
    galleryState.sourceKey === normalizedImagesKey
      ? galleryState.orderedImages
      : normalizedImages;

  const hasUnsavedChanges = useMemo(
    () => !areArraysEqual(normalizedImages, orderedImages),
    [normalizedImages, orderedImages],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function updateOrderedImages(
    updater: (currentImages: string[]) => string[],
  ) {
    setGalleryState((currentState) => {
      const currentImages =
        currentState.sourceKey === normalizedImagesKey
          ? currentState.orderedImages
          : normalizedImages;

      return {
        sourceKey: normalizedImagesKey,
        orderedImages: updater(currentImages),
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    updateOrderedImages((items) => {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) {
        return items;
      }

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function moveImage(index: number, direction: "up" | "down") {
    updateOrderedImages((items) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (
        index < 0 ||
        index >= items.length ||
        targetIndex < 0 ||
        targetIndex >= items.length
      ) {
        return items;
      }

      return arrayMove(items, index, targetIndex);
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
              {isArabic
                ? "رتّب صورك بالطريقة التي تريدها"
                : "Arrange Your Portfolio Images"}
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
                talentName={talentName}
                isArabic={isArabic}
                isFirst={index === 0}
                isLast={index === orderedImages.length - 1}
                moveUp={() => moveImage(index, "up")}
                moveDown={() => moveImage(index, "down")}
                removeAction={removeAction}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
