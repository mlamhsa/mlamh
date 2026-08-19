"use client";

import {
  Pause,
  Play,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type VoiceMessagePlayerProps = {
  src: string;
  isOwnMessage: boolean;
  isArabic: boolean;
};

function formatDuration(
  value: number,
) {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return "0:00";
  }

  const minutes = Math.floor(
    value / 60,
  );

  const seconds = Math.floor(
    value % 60,
  );

  return `${minutes}:${String(
    seconds,
  ).padStart(2, "0")}`;
}

async function resolveAudioDuration(
  audio: HTMLAudioElement,
): Promise<number> {
  const directDuration =
    audio.duration;

  if (
    Number.isFinite(
      directDuration,
    ) &&
    directDuration > 0
  ) {
    return directDuration;
  }

  return await new Promise<number>(
    (resolve) => {
      let resolved = false;

      function finish(
        value: number,
      ) {
        if (resolved) {
          return;
        }

        resolved = true;

        cleanup();

        resolve(
          Number.isFinite(value) &&
          value > 0
            ? value
            : 0,
        );
      }

      function cleanup() {
        audio.removeEventListener(
          "durationchange",
          handleDurationChange,
        );

        audio.removeEventListener(
          "timeupdate",
          handleTimeUpdate,
        );

        audio.removeEventListener(
          "seeked",
          handleSeeked,
        );

        audio.removeEventListener(
          "error",
          handleError,
        );
      }

      function handleDurationChange() {
        if (
          Number.isFinite(
            audio.duration,
          ) &&
          audio.duration > 0
        ) {
          finish(
            audio.duration,
          );
        }
      }

      function handleTimeUpdate() {
        if (
          Number.isFinite(
            audio.duration,
          ) &&
          audio.duration > 0
        ) {
          finish(
            audio.duration,
          );
        }
      }

      function handleSeeked() {
        const duration =
          audio.duration;

        const current =
          audio.currentTime;

        if (
          Number.isFinite(duration) &&
          duration > 0
        ) {
          finish(duration);
          return;
        }

        if (
          Number.isFinite(current) &&
          current > 0
        ) {
          finish(current);
        }
      }

      function handleError() {
        finish(0);
      }

      audio.addEventListener(
        "durationchange",
        handleDurationChange,
      );

      audio.addEventListener(
        "timeupdate",
        handleTimeUpdate,
      );

      audio.addEventListener(
        "seeked",
        handleSeeked,
      );

      audio.addEventListener(
        "error",
        handleError,
      );

      try {
        /*
         * بعض تسجيلات MediaRecorder بصيغة WebM
         * تأتي بدون duration metadata صحيحة.
         *
         * النقل إلى قيمة زمنية كبيرة يجبر المتصفح
         * على حساب النهاية الحقيقية للملف.
         */
        audio.currentTime =
          Number.MAX_SAFE_INTEGER;
      } catch {
        finish(0);
      }

      window.setTimeout(
        () => {
          if (
            Number.isFinite(
              audio.duration,
            ) &&
            audio.duration > 0
          ) {
            finish(
              audio.duration,
            );

            return;
          }

          if (
            Number.isFinite(
              audio.currentTime,
            ) &&
            audio.currentTime > 0
          ) {
            finish(
              audio.currentTime,
            );

            return;
          }

          finish(0);
        },
        1500,
      );
    },
  );
}

export default function VoiceMessagePlayer({
  src,
  isOwnMessage,
  isArabic,
}: VoiceMessagePlayerProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    duration,
    setDuration,
  ] = useState(0);

  const waveform = useMemo(
    () => [
      8, 16, 11, 22, 14, 28, 18, 12,
      25, 17, 30, 20, 13, 24, 16, 27,
      19, 12, 23, 15, 29, 18, 10, 21,
      14, 26, 17, 11, 24, 16, 28, 19,
      13, 22, 15, 25, 18, 12, 23, 16,
    ],
    [],
  );

  const progress =
    duration > 0
      ? Math.min(
          currentTime / duration,
          1,
        )
      : 0;

      useEffect(() => {
        const currentAudio =
          audioRef.current;
      
        if (!currentAudio) {
          return;
        }
      
        const audio: HTMLAudioElement =
          currentAudio;

    let cancelled = false;

    function syncDuration() {
      const currentAudio =
        audioRef.current;

      if (!currentAudio) {
        return;
      }

      const nextDuration =
        currentAudio.duration;

      if (
        Number.isFinite(
          nextDuration,
        ) &&
        nextDuration > 0
      ) {
        setDuration(
          nextDuration,
        );
      }
    }

    function handleTimeUpdate() {
      const currentAudio =
        audioRef.current;

      if (!currentAudio) {
        return;
      }

      setCurrentTime(
        currentAudio.currentTime,
      );
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
    }

    async function initializeDuration() {
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);

      audio.load();

      const resolvedDuration =
        await resolveAudioDuration(
          audio,
        );

      if (cancelled) {
        return;
      }

      if (
        resolvedDuration > 0
      ) {
        setDuration(
          resolvedDuration,
        );

        try {
          audio.currentTime = 0;
        } catch {
          // لا شيء
        }
      }
    }

    audio.addEventListener(
      "loadedmetadata",
      syncDuration,
    );

    audio.addEventListener(
      "durationchange",
      syncDuration,
    );

    audio.addEventListener(
      "canplay",
      syncDuration,
    );

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate,
    );

    audio.addEventListener(
      "play",
      handlePlay,
    );

    audio.addEventListener(
      "pause",
      handlePause,
    );

    audio.addEventListener(
      "ended",
      handleEnded,
    );

    void initializeDuration();

    return () => {
      cancelled = true;

      audio.pause();

      audio.removeEventListener(
        "loadedmetadata",
        syncDuration,
      );

      audio.removeEventListener(
        "durationchange",
        syncDuration,
      );

      audio.removeEventListener(
        "canplay",
        syncDuration,
      );

      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );

      audio.removeEventListener(
        "play",
        handlePlay,
      );

      audio.removeEventListener(
        "pause",
        handlePause,
      );

      audio.removeEventListener(
        "ended",
        handleEnded,
      );
    };
  }, [src]);

  async function togglePlayback() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.error(
          "[VoiceMessagePlayer play]",
          error,
        );
      }

      return;
    }

    audio.pause();
  }

  function seekToPosition(
    event:
      React.MouseEvent<HTMLDivElement>,
  ) {
    const audio =
      audioRef.current;

    if (
      !audio ||
      duration <= 0
    ) {
      return;
    }

    const rect =
      event.currentTarget
        .getBoundingClientRect();

    const ratio =
      (event.clientX -
        rect.left) /
      rect.width;

    const nextTime =
      Math.max(
        0,
        Math.min(
          duration,
          ratio * duration,
        ),
      );

    audio.currentTime =
      nextTime;

    setCurrentTime(
      nextTime,
    );
  }

  return (
    <div
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="flex w-full min-w-[220px] max-w-full items-center gap-3 sm:min-w-[280px]"
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />

      <button
        type="button"
        onClick={
          togglePlayback
        }
        aria-label={
          isPlaying
            ? isArabic
              ? "إيقاف مؤقت"
              : "Pause"
            : isArabic
              ? "تشغيل"
              : "Play"
        }
        className={`flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full transition active:scale-95 ${
          isOwnMessage
            ? "bg-black/10 text-black"
            : "bg-gold/15 text-gold"
        }`}
      >
        {isPlaying ? (
          <Pause
            size={18}
            fill="currentColor"
          />
        ) : (
          <Play
            size={18}
            fill="currentColor"
          />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div
          role="slider"
          aria-label={
            isArabic
              ? "تقدم الرسالة الصوتية"
              : "Voice message progress"
          }
          aria-valuemin={0}
          aria-valuemax={
            Math.max(
              duration,
              0,
            )
          }
          aria-valuenow={
            Math.min(
              currentTime,
              duration || 0,
            )
          }
          onClick={
            seekToPosition
          }
          className="flex h-9 cursor-pointer touch-manipulation items-center gap-[2px]"
        >
          {waveform.map(
            (
              height,
              index,
            ) => {
              const barProgress =
                (index + 1) /
                waveform.length;

              const active =
                barProgress <=
                progress;

              return (
                <span
                  key={`${height}-${index}`}
                  className={`w-[2px] shrink-0 rounded-full transition ${
                    active
                      ? isOwnMessage
                        ? "bg-black/80"
                        : "bg-gold"
                      : isOwnMessage
                        ? "bg-black/25"
                        : "bg-white/20"
                  }`}
                  style={{
                    height:
                      `${height}px`,
                  }}
                />
              );
            },
          )}
        </div>

        <div
          dir="ltr"
          className={`mt-0.5 flex items-center justify-between gap-2 text-[10px] tabular-nums ${
            isOwnMessage
              ? "text-black/50"
              : "text-white/35"
          }`}
        >
          <span>
            {formatDuration(
              currentTime,
            )}
          </span>

          <span>
            {formatDuration(
              duration,
            )}
          </span>
        </div>
      </div>
    </div>
  );
}