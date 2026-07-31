"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useFormStatus } from "react-dom";

type ServerAction = (formData: FormData) => void | Promise<void>;

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type GalleryUploadButtonProps = {
  isArabic: boolean;
  locale: string;
  currentImageCount: number;
  maxImages?: number;
  action: ServerAction;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function UploadIcon({ className = "h-4 w-4" }: { className?: string }) {
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
        d="M12 16V5M8 9l4-4 4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14.5v3A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoadingIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RemoveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function SubmitButton({
  isArabic,
  disabled,
  selectedCount,
}: {
  isArabic: boolean;
  disabled: boolean;
  selectedCount: number;
}) {
  const { pending } = useFormStatus();

  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-6 text-sm transition sm:w-auto ${
        isDisabled
          ? "cursor-not-allowed border-white/10 bg-white/[0.05] text-white/30"
          : "border-gold/40 bg-gold text-black hover:bg-gold-soft active:scale-[0.99]"
      }`}
    >
      {pending ? (
        <>
          <LoadingIcon />
          {isArabic
            ? `جارٍ رفع ${selectedCount} ${
                selectedCount === 1 ? "صورة" : "صور"
              }...`
            : `Uploading ${selectedCount} ${
                selectedCount === 1 ? "image" : "images"
              }...`}
        </>
      ) : (
        <>
          <UploadIcon />
          {isArabic
            ? selectedCount > 1
              ? `رفع ${selectedCount} صور`
              : "رفع الصورة"
            : selectedCount > 1
              ? `Upload ${selectedCount} Images`
              : "Upload Image"}
        </>
      )}
    </button>
  );
}

export function GalleryUploadButton({
  isArabic,
  locale,
  currentImageCount,
  maxImages = 20,
  action,
}: GalleryUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const remainingSlots = Math.max(0, maxImages - currentImageCount);

  const selectedCount = selectedImages.length;

  const canSubmit =
    selectedCount > 0 &&
    selectedCount <= remainingSlots &&
    remainingSlots > 0 &&
    !errorMessage;

  const capacityText = useMemo(() => {
    if (isArabic) {
      return `يمكنك إضافة ${remainingSlots} ${
        remainingSlots === 1 ? "صورة" : "صور"
      } أخرى`;
    }

    return `You can add ${remainingSlots} more ${
      remainingSlots === 1 ? "image" : "images"
    }`;
  }, [isArabic, remainingSlots]);

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [selectedImages]);

  function syncInputFiles(images: SelectedImage[]) {
    if (!inputRef.current) return;

    const dataTransfer = new DataTransfer();

    images.forEach((image) => {
      dataTransfer.items.add(image.file);
    });

    inputRef.current.files = dataTransfer.files;
  }

  function validateFiles(files: File[]) {
    if (files.length > remainingSlots) {
      return isArabic
        ? `يمكنك اختيار ${remainingSlots} ${
            remainingSlots === 1 ? "صورة فقط" : "صور فقط"
          }.`
        : `You can select only ${remainingSlots} more ${
            remainingSlots === 1 ? "image" : "images"
          }.`;
    }

    const invalidType = files.find(
      (file) => !ACCEPTED_TYPES.includes(file.type)
    );

    if (invalidType) {
      return isArabic
        ? `الملف "${invalidType.name}" غير مدعوم. استخدم JPG أو PNG أو WEBP.`
        : `"${invalidType.name}" is unsupported. Use JPG, PNG, or WEBP.`;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      return isArabic
        ? `حجم الصورة "${oversizedFile.name}" يتجاوز 10MB.`
        : `"${oversizedFile.name}" exceeds 10MB.`;
    }

    return "";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    selectedImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    if (files.length === 0) {
      setSelectedImages([]);
      setErrorMessage("");
      return;
    }

    const validationError = validateFiles(files);

    if (validationError) {
      setSelectedImages([]);
      setErrorMessage(validationError);
      event.target.value = "";
      return;
    }

    const nextImages = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedImages(nextImages);
    setErrorMessage("");
  }

  function removeSelectedImage(id: string) {
    const removedImage = selectedImages.find((image) => image.id === id);

    if (removedImage) {
      URL.revokeObjectURL(removedImage.previewUrl);
    }

    const nextImages = selectedImages.filter((image) => image.id !== id);

    setSelectedImages(nextImages);
    setErrorMessage("");
    syncInputFiles(nextImages);
  }

  function clearSelection() {
    selectedImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    setSelectedImages([]);
    setErrorMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <label
        className={`group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center transition ${
          remainingSlots > 0
            ? "border-white/15 bg-black/25 hover:border-gold/35 hover:bg-gold/[0.03]"
            : "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50"
        }`}
      >
        <UploadIcon className="h-6 w-6 text-gold" />

        <span className="mt-3 text-sm text-white/70">
          {isArabic
            ? "اضغط لاختيار صورة أو عدة صور"
            : "Click to choose one or multiple images"}
        </span>

        <span className="mt-1 text-xs text-white/30">
          {isArabic
            ? "JPG أو PNG أو WEBP — بحد أقصى 10MB لكل صورة"
            : "JPG, PNG, or WEBP — maximum 10MB per image"}
        </span>

        <span className="mt-2 text-xs text-gold/75">{capacityText}</span>

        <input
          ref={inputRef}
          type="file"
          name="image_file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          disabled={remainingSlots === 0}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-300/[0.06] px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/75">
                {isArabic
                  ? `تم اختيار ${selectedCount} ${
                      selectedCount === 1 ? "صورة" : "صور"
                    }`
                  : `${selectedCount} ${
                      selectedCount === 1 ? "image" : "images"
                    } selected`}
              </p>
              <p className="mt-1 text-xs text-white/35">
                {isArabic
                  ? "راجع الصور قبل رفعها، ويمكنك إزالة أي صورة."
                  : "Review the images before uploading and remove any you do not want."}
              </p>
            </div>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:border-red-300/25 hover:text-red-200"
            >
              {isArabic ? "إلغاء الاختيار" : "Clear Selection"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {selectedImages.map((image, index) => (
              <article
                key={image.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-black"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={image.previewUrl}
                    alt={
                      isArabic
                        ? `معاينة الصورة ${index + 1}`
                        : `Image preview ${index + 1}`
                    }
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">
                    #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeSelectedImage(image.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-300/25 bg-black/65 text-red-200 backdrop-blur transition hover:bg-red-300/15"
                    aria-label={
                      isArabic
                        ? `إزالة الصورة ${index + 1}`
                        : `Remove image ${index + 1}`
                    }
                  >
                    <RemoveIcon />
                  </button>
                </div>

                <div className="border-t border-white/10 px-3 py-2">
                  <p className="truncate text-[11px] text-white/45">
                    {image.file.name}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/30">
          {isArabic
            ? "لن يتم رفع الصور إلا بعد الضغط على زر الرفع."
            : "Images are uploaded only after pressing the upload button."}
        </p>

        <SubmitButton
          isArabic={isArabic}
          disabled={!canSubmit}
          selectedCount={selectedCount}
        />
      </div>
    </form>
  );
}
