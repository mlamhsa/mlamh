"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";

type Props = {
  locale: "ar" | "en";
  title: string;
  content: string;
  readTimeMinutes?: number | null;
};

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

function stripMarkdown(input: string) {
  return input
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function SceneReadingExperience({ locale, title, content, readTimeMinutes }: Props) {
  const isArabic = locale === "ar";
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<(typeof SPEEDS)[number]>(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speechText = useMemo(() => `${title}. ${stripMarkdown(content)}`, [title, content]);
  const listeningMinutes = Math.max(1, Math.ceil((speechText.split(/\s+/).length || 1) / 150));

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    const onScroll = () => {
      const article = document.querySelector("[data-scene-article]") as HTMLElement | null;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleHeight = article.offsetHeight;
      const viewport = window.innerHeight;
      const scrolled = window.scrollY - articleTop + viewport * 0.18;
      const max = Math.max(articleHeight - viewport * 0.35, 1);
      setProgress(Math.min(100, Math.max(0, (scrolled / max) * 100)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const chooseVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const prefix = isArabic ? "ar" : "en";
    return voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) || null;
  };

  const start = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isArabic ? "ar-SA" : "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const togglePlayback = () => {
    if (!supported) return;
    if (!isSpeaking) {
      start();
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const reset = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const changeRate = (next: (typeof SPEEDS)[number]) => {
    setRate(next);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = isArabic ? "ar-SA" : "en-US";
        utterance.rate = next;
        const voice = chooseVoice();
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
      }, 30);
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[70] h-[2px] bg-transparent">
        <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="mb-9 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Volume2 className="h-4 w-4 text-gold" />
              <span>{isArabic ? "استمع للمقال" : "Listen to this article"}</span>
            </div>
            <p className="mt-1 text-xs leading-6 text-white/40">
              {isArabic
                ? `${readTimeMinutes || "—"} دقائق قراءة · نحو ${listeningMinutes} دقائق استماع`
                : `${readTimeMinutes || "—"} min read · about ${listeningMinutes} min listen`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              disabled={!supported}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={isArabic ? "تشغيل أو إيقاف القراءة الصوتية" : "Play or pause audio reading"}
            >
              {isSpeaking && !isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSpeaking && !isPaused
                ? isArabic
                  ? "إيقاف مؤقت"
                  : "Pause"
                : isPaused
                  ? isArabic
                    ? "متابعة"
                    : "Resume"
                  : isArabic
                    ? "تشغيل"
                    : "Play"}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={!supported || (!isSpeaking && !isPaused)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition hover:border-gold/30 hover:text-gold disabled:opacity-30"
              aria-label={isArabic ? "إعادة القراءة من البداية" : "Restart audio reading"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/35 p-1">
              {SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => changeRate(speed)}
                  className={`rounded-full px-2.5 py-1.5 text-[11px] transition ${rate === speed ? "bg-white/10 text-gold" : "text-white/40 hover:text-white/70"}`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {!supported ? (
          <p className="mt-3 text-xs text-white/35">
            {isArabic ? "القراءة الصوتية غير مدعومة في هذا المتصفح." : "Audio reading is not supported by this browser."}
          </p>
        ) : null}
      </div>
    </>
  );
}
