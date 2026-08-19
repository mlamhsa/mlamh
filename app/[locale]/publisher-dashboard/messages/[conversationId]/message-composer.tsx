"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Square,
  Trash2,
  X,
} from "lucide-react";

import { sendMessageAction } from "@/lib/actions/message-actions";
import { compressImageForMessage } from "@/lib/messages/compress-image";
import VoiceMessagePlayer from "@/components/messages/VoiceMessagePlayer";
import { supabase } from "@/lib/supabase/client";

type MessageComposerProps = {
  conversationId: number;
  currentUserId: string;
  locale: string;
};

const MAX_ATTACHMENT_SIZE =
  10 * 1024 * 1024;

const ACCEPTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(bytes / 1024),
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatRecordingDuration(
  totalSeconds: number,
) {
  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

export default function MessageComposer({
  conversationId,
  currentUserId,
  locale,
}: MessageComposerProps) {
  const isArabic = locale === "ar";

  const draftStorageKey =
    `message-draft:${currentUserId}:${conversationId}`;

  const formRef =
    useRef<HTMLFormElement | null>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const channelRef =
    useRef<
      ReturnType<typeof supabase.channel> | null
    >(null);

  const isChannelSubscribedRef =
    useRef(false);

  const isSubmittingRef =
    useRef(false);

    const mediaRecorderRef =
  useRef<MediaRecorder | null>(null);

const audioChunksRef =
  useRef<Blob[]>([]);

const recordingStreamRef =
  useRef<MediaStream | null>(null);

const recordingTimerRef =
  useRef<ReturnType<typeof setInterval> | null>(null);

const [
  isRecording,
  setIsRecording,
] = useState(false);

const [
  recordedAudio,
  setRecordedAudio,
] = useState<File | null>(null);

const [
  recordedAudioUrl,
  setRecordedAudioUrl,
] = useState<string | null>(null);

const [
  recordingSeconds,
  setRecordingSeconds,
] = useState(0);

const [
  recordingError,
  setRecordingError,
] = useState<string | null>(null);

  const [
    selectedAttachment,
    setSelectedAttachment,
  ] = useState<File | null>(null);

  const [
    originalAttachmentSize,
    setOriginalAttachmentSize,
  ] = useState<number | null>(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(null);

  const [
    isCompressing,
    setIsCompressing,
  ] = useState(false);

  const [
    attachmentError,
    setAttachmentError,
  ] = useState<string | null>(null);

  const quickReplies = isArabic
    ? [
        "نود تحديد موعد للمقابلة.",
        "هل أنت متاح في الموعد المقترح؟",
        "يرجى إرسال نماذج أعمال إضافية.",
        "تم اختيارك للخطوة التالية.",
      ]
    : [
        "We would like to schedule an interview.",
        "Are you available at the proposed time?",
        "Please send additional work samples.",
        "You have been selected for the next step.",
      ];

  function resizeTextarea() {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const maximumHeight = 128;

    textarea.style.height =
      `${Math.min(
        textarea.scrollHeight,
        maximumHeight,
      )}px`;

    textarea.style.overflowY =
      textarea.scrollHeight >
      maximumHeight
        ? "auto"
        : "hidden";
  }

  function resetTextareaSize() {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.overflowY = "hidden";
  }

  function saveDraft(value: string) {
    try {
      if (value.trim()) {
        window.localStorage.setItem(
          draftStorageKey,
          value,
        );
      } else {
        window.localStorage.removeItem(
          draftStorageKey,
        );
      }
    } catch {
      // تعذر التخزين المحلي لا يمنع استخدام الدردشة.
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(
        draftStorageKey,
      );
    } catch {
      // تعذر التخزين المحلي لا يمنع استخدام الدردشة.
    }
  }

  function clearAttachment() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setPreviewUrl(null);
    setSelectedAttachment(null);
    setOriginalAttachmentSize(null);
    setAttachmentError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(
        recordingTimerRef.current,
      );
  
      recordingTimerRef.current =
        null;
    }
  }
  
  function stopRecordingStream() {
    const stream =
      recordingStreamRef.current;
  
    if (stream) {
      stream.getTracks().forEach(
        (track) => {
          track.stop();
        },
      );
    }
  
    recordingStreamRef.current =
      null;
  }
  
  function clearRecordedAudio() {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(
        recordedAudioUrl,
      );
    }
  
    setRecordedAudioUrl(null);
    setRecordedAudio(null);
    setRecordingSeconds(0);
    setRecordingError(null);
  
    audioChunksRef.current = [];
  }
  
  async function startRecording() {
    if (
      isRecording ||
      isSubmittingRef.current ||
      isCompressing ||
      selectedAttachment ||
      recordedAudio
    ) {
      return;
    }
  
    setRecordingError(null);
  
    if (
      typeof window !==
        "undefined" &&
      !window.isSecureContext
    ) {
      setRecordingError(
        isArabic
          ? "التسجيل الصوتي يتطلب اتصالًا آمنًا HTTPS."
          : "Voice recording requires a secure HTTPS connection.",
      );
    
      return;
    }
    
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setRecordingError(
        isArabic
          ? "التسجيل الصوتي غير مدعوم في هذا المتصفح."
          : "Voice recording is not supported in this browser.",
      );
  
      return;
    }
  
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
  
      recordingStreamRef.current =
        stream;
  
      audioChunksRef.current = [];
  
      let mimeType = "";
  
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];
  
      for (const type of preferredTypes) {
        if (
          MediaRecorder.isTypeSupported(
            type,
          )
        ) {
          mimeType = type;
          break;
        }
      }
  
      const recorder = mimeType
        ? new MediaRecorder(
            stream,
            {
              mimeType,
            },
          )
        : new MediaRecorder(
            stream,
          );
  
      mediaRecorderRef.current =
        recorder;
  
      recorder.ondataavailable = (
        event,
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data,
          );
        }
      };
  
      recorder.onstop = () => {
        clearRecordingTimer();
        stopRecordingStream();
  
        const chunks =
          audioChunksRef.current;
  
        if (chunks.length === 0) {
          setRecordingError(
            isArabic
              ? "لم يتم تسجيل صوت. حاول مرة أخرى."
              : "No audio was recorded. Please try again.",
          );
  
          setIsRecording(false);
  
          return;
        }
  
        const finalMimeType =
          recorder.mimeType ||
          chunks[0]?.type ||
          "audio/webm";
  
        const audioBlob =
          new Blob(
            chunks,
            {
              type: finalMimeType,
            },
          );
  
        const extension =
          finalMimeType.includes(
            "mp4",
          )
            ? "m4a"
            : "webm";
  
        const audioFile =
          new File(
            [
              audioBlob,
            ],
            `voice-${Date.now()}.${extension}`,
            {
              type: finalMimeType,
            },
          );
  
        if (
          audioFile.size >
          MAX_ATTACHMENT_SIZE
        ) {
          setRecordingError(
            isArabic
              ? "التسجيل الصوتي يتجاوز الحد المسموح وهو 10 ميجابايت."
              : "The voice recording exceeds the 10 MB limit.",
          );
  
          setIsRecording(false);
          audioChunksRef.current = [];
  
          return;
        }
  
        if (recordedAudioUrl) {
          URL.revokeObjectURL(
            recordedAudioUrl,
          );
        }
  
        setRecordedAudio(
          audioFile,
        );
  
        setRecordedAudioUrl(
          URL.createObjectURL(
            audioFile,
          ),
        );
  
        setIsRecording(false);
      };
  
      recorder.onerror = () => {
        clearRecordingTimer();
        stopRecordingStream();
  
        setIsRecording(false);
  
        setRecordingError(
          isArabic
            ? "حدث خطأ أثناء التسجيل الصوتي."
            : "An error occurred while recording audio.",
        );
      };
  
      setRecordingSeconds(0);
      setIsRecording(true);
  
      recorder.start(250);
  
      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds(
            (seconds) =>
              seconds + 1,
          );
        }, 1000);
    } catch (error) {
      console.error(
        "[MessageComposer voice recording]",
        error,
      );
  
      clearRecordingTimer();
      stopRecordingStream();
  
      setIsRecording(false);
  
      setRecordingError(
        isArabic
          ? "تعذر الوصول إلى الميكروفون. تحقق من صلاحية الميكروفون وحاول مرة أخرى."
          : "Unable to access the microphone. Check microphone permission and try again.",
      );
    }
  }
  
  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;
  
    if (
      !recorder ||
      recorder.state === "inactive"
    ) {
      return;
    }
  
    recorder.stop();
  }
  
  function cancelRecording() {
    const recorder =
      mediaRecorderRef.current;
  
    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.ondataavailable =
        null;
  
      recorder.onstop = null;
  
      recorder.stop();
    }
  
    mediaRecorderRef.current =
      null;
  
    clearRecordingTimer();
    stopRecordingStream();
  
    audioChunksRef.current = [];
  
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordingError(null);
  }

  useEffect(() => {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      return;
    }

    try {
      const savedDraft =
        window.localStorage.getItem(
          draftStorageKey,
        );

      if (savedDraft) {
        textarea.value =
          savedDraft;

        window.requestAnimationFrame(
          () => {
            resizeTextarea();
          },
        );
      }
    } catch {
      // عدم توفر localStorage لا يمنع استخدام الدردشة.
    }
  }, [draftStorageKey]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(
          recordedAudioUrl,
        );
      }
    };
  }, [recordedAudioUrl]);

  useEffect(() => {
    return () => {
      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current,
        );
  
        recordingTimerRef.current =
          null;
      }
  
      const recorder =
        mediaRecorderRef.current;
  
      if (
        recorder &&
        recorder.state !== "inactive"
      ) {
        recorder.ondataavailable =
          null;
  
        recorder.onstop = null;
  
        recorder.stop();
      }
  
      const stream =
        recordingStreamRef.current;
  
      if (stream) {
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
  
      recordingStreamRef.current =
        null;
  
      mediaRecorderRef.current =
        null;
  
      audioChunksRef.current = [];
    };
  }, []);

  useEffect(() => {
    const typingChannel =
      supabase.channel(
        `conversation-typing-${conversationId}`,
      );

    channelRef.current =
      typingChannel;

    typingChannel.subscribe(
      (status) => {
        isChannelSubscribedRef.current =
          status === "SUBSCRIBED";
      },
    );

    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current,
        );
      }

      if (
        isChannelSubscribedRef.current
      ) {
        void typingChannel.send({
          type: "broadcast",
          event: "typing",
          payload: {
            userId:
              currentUserId,
            isTyping: false,
          },
        });
      }

      isChannelSubscribedRef.current =
        false;

      channelRef.current = null;

      void supabase.removeChannel(
        typingChannel,
      );
    };
  }, [
    conversationId,
    currentUserId,
  ]);

  function broadcastTyping(
    isTyping: boolean,
  ) {
    const typingChannel =
      channelRef.current;

    if (
      !typingChannel ||
      !isChannelSubscribedRef.current
    ) {
      return;
    }

    void typingChannel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: currentUserId,
        isTyping,
      },
    });
  }

  function stopTypingTimer() {
    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current,
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        broadcastTyping(false);
      }, 1200);
  }

  function handleInput(
    event:
      React.FormEvent<HTMLTextAreaElement>,
  ) {
    resizeTextarea();

    saveDraft(
      event.currentTarget.value,
    );

    broadcastTyping(true);
    stopTypingTimer();
  }

  function insertQuickReply(
    value: string,
  ) {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.value = value;
    textarea.focus();

    textarea.setSelectionRange(
      value.length,
      value.length,
    );

    saveDraft(value);
    resizeTextarea();

    broadcastTyping(true);
    stopTypingTimer();
  }

  async function handleAttachmentChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setAttachmentError(null);

    if (
      !ACCEPTED_ATTACHMENT_TYPES.includes(
        file.type,
      )
    ) {
      setAttachmentError(
        isArabic
          ? "نوع الملف غير مدعوم. استخدم صورة أو PDF أو Word."
          : "Unsupported file type. Use an image, PDF, or Word document.",
      );

      event.currentTarget.value =
        "";

      return;
    }

    if (
      file.size >
      MAX_ATTACHMENT_SIZE
    ) {
      setAttachmentError(
        isArabic
          ? "حجم الملف يتجاوز 10 ميجابايت."
          : "The file exceeds the 10 MB limit.",
      );

      event.currentTarget.value =
        "";

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setOriginalAttachmentSize(
      file.size,
    );

    setIsCompressing(true);

    try {
      const processedFile =
        file.type.startsWith(
          "image/",
        )
          ? await compressImageForMessage(
              file,
            )
          : file;

      if (
        processedFile.size >
        MAX_ATTACHMENT_SIZE
      ) {
        setAttachmentError(
          isArabic
            ? "حجم الملف بعد المعالجة يتجاوز 10 ميجابايت."
            : "The processed file exceeds the 10 MB limit.",
        );

        event.currentTarget.value =
          "";

        setSelectedAttachment(
          null,
        );

        setOriginalAttachmentSize(
          null,
        );

        return;
      }

      setSelectedAttachment(
        processedFile,
      );

      if (
        processedFile.type.startsWith(
          "image/",
        )
      ) {
        setPreviewUrl(
          URL.createObjectURL(
            processedFile,
          ),
        );
      } else {
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error(
        "[MessageComposer compression]",
        error,
      );

      setAttachmentError(
        isArabic
          ? "تعذر تجهيز الصورة. حاول مرة أخرى."
          : "Unable to prepare the image. Please try again.",
      );

      event.currentTarget.value =
        "";

      setSelectedAttachment(null);
      setOriginalAttachmentSize(
        null,
      );
    } finally {
      setIsCompressing(false);
    }
  }

  function handleKeyDown(
    event:
      React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();

    const hasText =
      Boolean(
        event.currentTarget.value.trim(),
      );

    if (
  isSubmittingRef.current ||
  isCompressing ||
  isRecording ||
  (!hasText &&
    !selectedAttachment &&
    !recordedAudio)
) {
  return;
}

    broadcastTyping(false);

    formRef.current?.requestSubmit();
  }

  async function handleFormAction(
    formData: FormData,
  ) {
    if (
      isSubmittingRef.current ||
      isCompressing ||
      isRecording
    ) {
      return;
    }

    const body = String(
      formData.get("body") ?? "",
    ).trim();

    if (
      !body &&
      !selectedAttachment &&
      !recordedAudio
    ) {
      textareaRef.current?.focus();
      return;
    }

    const attachmentToSend =
  selectedAttachment ??
  recordedAudio;

if (attachmentToSend) {
  formData.set(
    "attachment",
    attachmentToSend,
    attachmentToSend.name,
  );
}

    isSubmittingRef.current =
      true;

    broadcastTyping(false);

    try {
      await sendMessageAction(
        formData,
      );

      clearDraft();

formRef.current?.reset();

clearAttachment();
clearRecordedAudio();

resetTextareaSize();
    } finally {
      isSubmittingRef.current =
        false;
    }
  }

  const attachmentWasCompressed =
    selectedAttachment &&
    originalAttachmentSize !== null &&
    selectedAttachment.size <
      originalAttachmentSize;

  return (
    <div className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-black/90 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-5 sm:py-4">
      {!isRecording && !recordedAudio ? (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-gold/70">
            <span aria-hidden="true">✦</span>

            {isArabic
              ? "ردود سريعة"
              : "Quick replies"}
          </span>

          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() =>
                insertQuickReply(reply)
              }
              className="min-h-9 shrink-0 touch-manipulation rounded-full border border-white/10 bg-white/[0.025] px-3 text-[10px] text-white/45 transition hover:border-gold/35 hover:text-gold active:scale-[0.98]"
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}

      {isCompressing ? (
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-gold/15 bg-gold/[0.04] px-3 py-3">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />

          <span className="text-xs text-white/55">
            {isArabic
              ? "جارٍ ضغط وتجهيز الصورة..."
              : "Compressing and preparing image..."}
          </span>
        </div>
      ) : null}

      {selectedAttachment ? (
        <div className="mb-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex items-center gap-3 p-2.5">
            {previewUrl ? (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <img
                  src={previewUrl}
                  alt={selectedAttachment.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gold">
                <FileText size={20} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                dir="auto"
                className="truncate text-xs text-white/75"
              >
                {selectedAttachment.name}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/35">
                {attachmentWasCompressed ? (
                  <>
                    <span className="line-through">
                      {formatBytes(
                        originalAttachmentSize!,
                      )}
                    </span>

                    <span>→</span>

                    <span className="text-gold/80">
                      {formatBytes(
                        selectedAttachment.size,
                      )}
                    </span>

                    <span className="rounded-full bg-gold/10 px-1.5 py-0.5 text-gold/70">
                      {isArabic
                        ? "تم الضغط"
                        : "Compressed"}
                    </span>
                  </>
                ) : (
                  <span>
                    {formatBytes(
                      selectedAttachment.size,
                    )}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={clearAttachment}
              aria-label={
                isArabic
                  ? "إزالة المرفق"
                  : "Remove attachment"
              }
              className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 text-white/40 transition hover:border-red-400/30 hover:text-red-300 active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {attachmentError ? (
        <p className="mb-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-[11px] text-red-300/80">
          {attachmentError}
        </p>
      ) : null}

      {recordingError ? (
        <p className="mb-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-[11px] text-red-300/80">
          {recordingError}
        </p>
      ) : null}

      <form
        ref={formRef}
        action={handleFormAction}
        className={`rounded-2xl border p-2 shadow-inner shadow-black/20 transition sm:p-2.5 ${
          isRecording
            ? "border-red-400/25 bg-red-400/[0.045]"
            : recordedAudio
              ? "border-gold/20 bg-gold/[0.035]"
              : "border-white/10 bg-black/35 focus-within:border-gold/45 focus-within:bg-black/45"
        }`}
      >
        <input
          type="hidden"
          name="conversationId"
          value={conversationId}
        />

        <input
          type="hidden"
          name="locale"
          value={locale}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleAttachmentChange}
          className="hidden"
        />

        {isRecording ? (
          <div className="flex min-h-12 w-full items-center gap-2 sm:min-h-11 sm:gap-3">
            <button
              type="button"
              onClick={cancelRecording}
              aria-label={
                isArabic
                  ? "حذف التسجيل"
                  : "Discard recording"
              }
              title={
                isArabic
                  ? "حذف التسجيل"
                  : "Discard recording"
              }
              className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-red-400/20 bg-red-400/[0.04] text-red-300/80 transition hover:bg-red-400/[0.08] active:scale-95 sm:h-11 sm:w-11"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden px-1">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-red-400/35" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-red-400" />
              </span>

              <span
                dir="ltr"
                className="w-[46px] shrink-0 font-mono text-xs tabular-nums text-red-300 sm:text-sm"
              >
                {formatRecordingDuration(
                  recordingSeconds,
                )}
              </span>

              <div
                aria-hidden="true"
                className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[2px] overflow-hidden"
              >
                {[
                  8, 16, 11, 22, 14, 27, 18,
                  12, 25, 17, 29, 20, 13, 24,
                  16, 27, 19, 12, 23, 15, 28,
                  18, 10, 21, 14, 26, 17, 11,
                ].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-[2px] shrink-0 animate-pulse rounded-full bg-red-300/55"
                    style={{
                      height: `${height}px`,
                      animationDelay: `${
                        (index % 7) * 90
                      }ms`,
                    }}
                  />
                ))}
              </div>

              <span className="hidden shrink-0 text-[10px] text-white/35 sm:inline">
                {isArabic
                  ? "جارٍ التسجيل"
                  : "Recording"}
              </span>
            </div>

            <button
              type="button"
              onClick={stopRecording}
              aria-label={
                isArabic
                  ? "إيقاف التسجيل"
                  : "Stop recording"
              }
              title={
                isArabic
                  ? "إيقاف التسجيل"
                  : "Stop recording"
              }
              className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-red-400 text-black transition hover:brightness-105 active:scale-95 sm:h-11 sm:w-11"
            >
              <Square
                size={16}
                fill="currentColor"
              />
            </button>
          </div>
        ) : recordedAudio &&
          recordedAudioUrl ? (
          <div className="flex min-h-12 w-full items-center gap-2 sm:min-h-11 sm:gap-3">
            <button
              type="button"
              onClick={clearRecordedAudio}
              aria-label={
                isArabic
                  ? "حذف التسجيل"
                  : "Delete recording"
              }
              title={
                isArabic
                  ? "حذف التسجيل"
                  : "Delete recording"
              }
              className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-red-400/20 text-red-300/75 transition hover:bg-red-400/[0.06] active:scale-95 sm:h-11 sm:w-11"
            >
              <Trash2 size={18} />
            </button>

            <div className="min-w-0 flex-1 overflow-hidden [&>div]:!min-w-0 [&>div]:w-full">
              <VoiceMessagePlayer
                src={recordedAudioUrl}
                isOwnMessage={false}
                isArabic={isArabic}
              />
            </div>

            <SubmitButton
              isArabic={isArabic}
              disabled={isCompressing}
            />
          </div>
        ) : (
          <div className="flex w-full items-end gap-2 sm:gap-3">
            <button
              type="button"
              disabled={
                isCompressing ||
                Boolean(selectedAttachment)
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
              aria-label={
                isArabic
                  ? "إرفاق صورة أو ملف"
                  : "Attach image or file"
              }
              title={
                isArabic
                  ? "إرفاق صورة أو ملف"
                  : "Attach image or file"
              }
              className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white/45 transition hover:border-gold/35 hover:text-gold active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:h-11 sm:w-11"
            >
              <Paperclip size={19} />
            </button>

            <button
              type="button"
              disabled={
                isCompressing ||
                Boolean(selectedAttachment)
              }
              onClick={() => {
                void startRecording();
              }}
              aria-label={
                isArabic
                  ? "تسجيل رسالة صوتية"
                  : "Record voice message"
              }
              title={
                isArabic
                  ? "رسالة صوتية"
                  : "Voice message"
              }
              className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white/45 transition hover:border-gold/35 hover:text-gold active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:h-11 sm:w-11"
            >
              <Mic size={19} />
            </button>

            <label
              htmlFor="message-body"
              className="sr-only"
            >
              {isArabic
                ? "نص الرسالة"
                : "Message text"}
            </label>

            <textarea
              ref={textareaRef}
              id="message-body"
              name="body"
              maxLength={3000}
              rows={1}
              enterKeyHint="send"
              autoComplete="off"
              spellCheck
              onInput={handleInput}
              onBlur={() =>
                broadcastTyping(false)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                isArabic
                  ? "اكتب رسالتك..."
                  : "Write a message..."
              }
              className="max-h-32 min-h-12 min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-2 py-3 text-base leading-6 text-white outline-none placeholder:text-white/25 sm:min-h-11 sm:py-2.5 sm:text-sm"
            />

            <SubmitButton
              isArabic={isArabic}
              disabled={isCompressing}
            />
          </div>
        )}
      </form>

      <div className="mt-1.5 flex min-h-4 items-center justify-between gap-3 px-2">
        <p className="hidden text-[9px] text-white/20 sm:block">
          {isRecording
            ? isArabic
              ? "اضغط إيقاف لمراجعة التسجيل قبل الإرسال"
              : "Stop to review the recording before sending"
            : recordedAudio
              ? isArabic
                ? "استمع للتسجيل ثم أرسله أو احذفه"
                : "Review the recording, then send or delete it"
              : isArabic
                ? "Enter للإرسال • Shift + Enter لسطر جديد"
                : "Enter to send • Shift + Enter for a new line"}
        </p>

        <p className="text-[9px] text-white/20">
          {isRecording ? (
            <span className="inline-flex items-center gap-1.5 text-red-300/55">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              {isArabic
                ? "الميكروفون نشط"
                : "Microphone active"}
            </span>
          ) : recordedAudio ? (
            <span dir="ltr">
              {formatRecordingDuration(
                recordingSeconds,
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={10} />

              {isArabic
                ? "صور، PDF، Word ورسائل صوتية • حتى 10 MB"
                : "Images, PDF, Word & voice messages • up to 10 MB"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function SubmitButton({
  isArabic,
  disabled,
}: {
  isArabic: boolean;
  disabled: boolean;
}) {
  const { pending } =
    useFormStatus();

  const isDisabled =
    pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-label={
        pending
          ? isArabic
            ? "جارٍ الإرسال"
            : "Sending"
          : isArabic
            ? "إرسال"
            : "Send"
      }
      className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-gold text-black transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-[18px] w-[18px] ${
            isArabic
              ? "rotate-180"
              : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      )}
    </button>
  );
}