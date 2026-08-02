"use client";

import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

type GallerySortableListProps = {
  images: string[];
  mainImageUrl: string | null;
  talentName: string | null;
  reorderAction: ServerAction;
  setMainAction: ServerAction;
  removeAction: ServerAction;
};

function areArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => item === b[index]);
}

function SortableImageCard({
  imageUrl,
  index,
  isMain,
  talentName,
  setMainAction,
  removeAction,
}: {
  imageUrl: string;
  index: number;
  isMain: boolean;
  talentName: string | null;
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
  } = useSortable({
    id: imageUrl,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group overflow-hidden rounded-3xl border bg-gray-elevated/30 transition ${
        isDragging
          ? "scale-[0.98] border-gold/40 opacity-70 shadow-2xl"
          : "border-white/[0.08] hover:border-white/15"
      }`}
    >
      <div className="relative aspect-[3/4] bg-black">
        <Image
          src={imageUrl}
          alt={talentName || "Talent image"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <div className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-white/70 backdrop-blur">
            #{index + 1}
          </div>

          {isMain ? (
            <div className="rounded-full border border-gold/30 bg-black/50 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-gold backdrop-blur">
              Main Image
            </div>
          ) : null}
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute bottom-4 left-4 cursor-grab rounded-full border border-white/15 bg-black/55 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-white/75 backdrop-blur transition hover:border-gold/40 hover:text-gold active:cursor-grabbing"
        >
          ≡ Reorder
        </button>
      </div>

      <div className="flex flex-wrap gap-3 p-4">
        {!isMain ? (
          <form action={setMainAction}>
            <input
              type="hidden"
              name="image_url"
              value={imageUrl}
            />

            <button
              type="submit"
              className="rounded-full border border-gold/30 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10"
            >
              Set Main
            </button>
          </form>
        ) : null}

        <form action={removeAction}>
          <input
            type="hidden"
            name="image_url"
            value={imageUrl}
          />

          <button
            type="submit"
            className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-950/30"
          >
            Remove
          </button>
        </form>
      </div>
    </article>
  );
}

function GallerySortableListContent({
  images,
  mainImageUrl,
  talentName,
  reorderAction,
  setMainAction,
  removeAction,
}: GallerySortableListProps) {
  const [orderedImages, setOrderedImages] =
    useState<string[]>(images);

  const hasUnsavedChanges = useMemo(
    () => !areArraysEqual(images, orderedImages),
    [images, orderedImages],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrderedImages((items) => {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) {
        return items;
      }

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  const orderedImagesValue = JSON.stringify(orderedImages);

  return (
    <section>
      <div className="mb-5 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold">
              Portfolio Images
            </p>

            <h2 className="mt-2 text-2xl font-light text-white">
              Gallery Order
            </h2>

            <p className="mt-2 text-sm text-gray-muted">
              Drag images to adjust how the portfolio appears publicly.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-white/60">
              {orderedImages.length}{" "}
              {orderedImages.length === 1 ? "Image" : "Images"}
            </div>

            {hasUnsavedChanges ? (
              <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-amber-200">
                Unsaved Changes
              </div>
            ) : (
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                All Changes Saved
              </div>
            )}
          </div>
        </div>

        {hasUnsavedChanges ? (
          <form
            action={reorderAction}
            className="mt-5"
          >
            <input
              type="hidden"
              name="ordered_images"
              value={orderedImagesValue}
            />

            <button
              type="submit"
              className="rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
            >
              Save Order
            </button>
          </form>
        ) : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedImages}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {orderedImages.map((imageUrl, index) => (
              <SortableImageCard
                key={imageUrl}
                imageUrl={imageUrl}
                index={index}
                isMain={imageUrl === mainImageUrl}
                talentName={talentName}
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

export function GallerySortableList(
  props: GallerySortableListProps,
) {
  const imagesKey = JSON.stringify(props.images);

  return (
    <GallerySortableListContent
      key={imagesKey}
      {...props}
    />
  );
}