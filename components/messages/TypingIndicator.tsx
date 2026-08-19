type TypingIndicatorProps = {
    locale: string;
  };
  
  export default function TypingIndicator({
    locale,
  }: TypingIndicatorProps) {
    const isArabic = locale === "ar";
  
    return (
      <div
        className={`flex py-2 ${
          isArabic
            ? "justify-end"
            : "justify-start"
        }`}
        aria-live="polite"
        aria-label={
          isArabic
            ? "الطرف الآخر يكتب الآن"
            : "The other participant is typing"
        }
      >
        <div className="max-w-[86%] rounded-2xl rounded-es-md border border-white/10 bg-white/[0.055] px-4 py-3 shadow-lg shadow-black/15 sm:max-w-[70%]">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45" />
  
            <span className="ms-2 text-[10px] text-white/40">
              {isArabic
                ? "يكتب الآن..."
                : "Typing..."}
            </span>
          </div>
        </div>
      </div>
    );
  }