"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const QUARANTINE_BUCKET = "media-quarantine";

function extensionForFile(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return null;
}

function UploadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M12 16V5M8 9l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14.5v3A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-3" strokeLinecap="round" />
    </svg>
  );
}

function LoadingIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RemoveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
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
  const [isUploading, setIsUploading] = useState(false);

  const remainingSlots = Math.max(0, maxImages - currentImageCount);
  const selectedCount = selectedImages.length;
  const canSubmit = selectedCount > 0 && selectedCount <= remainingSlots && remainingSlots > 0 && !errorMessage && !isUploading;

  const capacityText = useMemo(() => {
    if (isArabic) {
      return `يمكنك إضافة ${remainingSlots} ${remainingSlots === 1 ? "صورة" : "صور"} أخرى`;
    }
    return `You can add ${remainingSlots} more ${remainingSlots === 1 ? "image" : "images"}`;
  }, [isArabic, remainingSlots]);

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [selectedImages]);

  function syncInputFiles(images: SelectedImage[]) {
    if (!inputRef.current) return;
    const dataTransfer = new DataTransfer();
    images.forEach((image) => dataTransfer.items.add(image.file));
    inputRef.current.files = dataTransfer.files;
  }

  function validateFiles(files: File[]) {
    if (files.length > remainingSlots) {
      return isArabic
        ? `يمكنك اختيار ${remainingSlots} ${remainingSlots === 1 ? "صورة فقط" : "صور فقط"}.`
        : `You can select only ${remainingSlots} more ${remainingSlots === 1 ? "image" : "images"}.`;
    }

    const invalidType = files.find((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalidType) {
      return isArabic
        ? `الملف "${invalidType.name}" غير مدعوم. استخدم JPG أو PNG أو WEBP.`
        : `"${invalidType.name}" is unsupported. Use JPG, PNG, or WEBP.`;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      return isArabic
        ? `حجم الصورة "${oversizedFile.name}" يتجاوز 5MB.`
        : `"${oversizedFile.name}" exceeds 5MB.`;
    }

    return "";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));

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
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedImages(nextImages);
    setErrorMessage("");
  }

  function removeSelectedImage(id: string) {
    const removedImage = selectedImages.find((image) => image.id === id);
    if (removedImage) URL.revokeObjectURL(removedImage.previewUrl);

    const nextImages = selectedImages.filter((image) => image.id !== id);
    setSelectedImages(nextImages);
    setErrorMessage("");
    syncInputFiles(nextImages);
  }

  function clearSelection() {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadSecurely() {
    if (!canSubmit) return;
    setIsUploading(true);
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user || !session.access_token) {
      setIsUploading(false);
      setErrorMessage(isArabic ? "انتهت جلسة الدخول. حدّث الصفحة وسجّل الدخول مرة أخرى." : "Your session expired. Refresh and sign in again.");
      return;
    }

    const cleanUrls: string[] = [];

    try {
      for (const selected of selectedImages) {
        const extension = extensionForFile(selected.file);
        if (!extension) throw new Error("unsupported_type");

        const quarantinePath = `${session.user.id}/gallery/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(QUARANTINE_BUCKET)
          .upload(quarantinePath, selected.file, {
            contentType: selected.file.type,
            cacheControl: "0",
            upsert: false,
          });

        if (uploadError) throw new Error("quarantine_upload_failed");

        let response: Response;
        try {
          response = await fetch("/api/media/process", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: quarantinePath, kind: "gallery" }),
          });
        } catch (error) {
          await supabase.storage.from(QUARANTINE_BUCKET).remove([quarantinePath]);
          throw error;
        }

        const payload = (await response.json().catch(() => null)) as { publicUrl?: unknown; error?: unknown } | null;
        if (!response.ok || typeof payload?.publicUrl !== "string" || !payload.publicUrl) {
          await supabase.storage.from(QUARANTINE_BUCKET).remove([quarantinePath]);
          throw new Error(typeof payload?.error === "string" ? payload.error : "image_processing_failed");
        }

        cleanUrls.push(payload.publicUrl);
      }

      const formData = new FormData();
      formData.set("locale", locale);
      cleanUrls.forEach((url) => formData.append("image_url", url));
      await action(formData);
    } catch (error) {
      console.error("[GalleryUploadButton] secure upload failed", error);
      setErrorMessage(
        isArabic
          ? "تعذر فحص ورفع إحدى الصور بأمان. تأكد أن الصورة سليمة وبحجم 5MB أو أقل ثم حاول مرة أخرى."
          : "A photo could not be securely processed. Make sure it is a valid image up to 5MB and try again.",
      );
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <label className={`group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center transition ${remainingSlots > 0 && !isUploading ? "border-white/15 bg-black/25 hover:border-gold/35 hover:bg-gold/[0.03]" : "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50"}`}>
        <UploadIcon className="h-6 w-6 text-gold" />
        <span className="mt-3 text-sm text-white/70">
          {isArabic ? "اضغط لاختيار صورة أو عدة صور" : "Click to choose one or multiple images"}
        </span>
        <span className="mt-1 text-xs text-white/30">
          {isArabic ? "JPG أو PNG أو WEBP — بحد أقصى 5MB لكل صورة" : "JPG, PNG, or WEBP — maximum 5MB per image"}
        </span>
        <span className="mt-2 text-xs text-gold/75">{capacityText}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={remainingSlots === 0 || isUploading}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-300/[0.06] px-4 py-3 text-sm text-red-200">{errorMessage}</div>
      ) : null}

      {selectedCount > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/75">
                {isArabic ? `تم اختيار ${selectedCount} ${selectedCount === 1 ? "صورة" : "صور"}` : `${selectedCount} ${selectedCount === 1 ? "image" : "images"} selected`}
              </p>
              <p className="mt-1 text-xs text-white/35">
                {isArabic ? "سيتم فحص الصور وإعادة بنائها بأمان قبل نشرها." : "Photos are inspected and safely reconstructed before publishing."}
              </p>
            </div>
            <button type="button" disabled={isUploading} onClick={clearSelection} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:border-red-300/25 hover:text-red-200 disabled:opacity-40">
              {isArabic ? "إلغاء الاختيار" : "Clear Selection"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {selectedImages.map((image, index) => (
              <article key={image.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                <div className="relative aspect-[4/5]">
                  <Image src={image.previewUrl} alt={isArabic ? `معاينة الصورة ${index + 1}` : `Image preview ${index + 1}`} fill unoptimized className="object-cover" />
                </div>
                <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">#{index + 1}</span>
                  <button type="button" disabled={isUploading} onClick={() => removeSelectedImage(image.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-red-300/25 bg-black/65 text-red-200 backdrop-blur transition hover:bg-red-300/15 disabled:opacity-40" aria-label={isArabic ? `إزالة الصورة ${index + 1}` : `Remove image ${index + 1}`}>
                    <RemoveIcon />
                  </button>
                </div>
                <div className="border-t border-white/10 px-3 py-2">
                  <p className="truncate text-[11px] text-white/45">{image.file.name}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/30">
          {isArabic ? "لن تُنشر أي صورة قبل اكتمال الفحص الأمني." : "No photo is published until security processing completes."}
        </p>
        <button type="button" disabled={!canSubmit} onClick={() => void uploadSecurely()} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-6 text-sm transition sm:w-auto ${canSubmit ? "border-gold/40 bg-gold text-black hover:bg-gold-soft active:scale-[0.99]" : "cursor-not-allowed border-white/10 bg-white/[0.05] text-white/30"}`}>
          {isUploading ? (
            <><LoadingIcon />{isArabic ? `جارٍ فحص ورفع ${selectedCount} ${selectedCount === 1 ? "صورة" : "صور"}...` : `Securely processing ${selectedCount} ${selectedCount === 1 ? "image" : "images"}...`}</>
          ) : (
            <><UploadIcon />{isArabic ? (selectedCount > 1 ? `فحص ورفع ${selectedCount} صور` : "فحص ورفع الصورة") : (selectedCount > 1 ? `Securely upload ${selectedCount} images` : "Securely upload image")}</>
          )}
        </button>
      </div>
    </div>
  );
}
