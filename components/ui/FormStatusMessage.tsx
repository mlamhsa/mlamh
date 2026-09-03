import type { ReactNode } from "react";

type FormStatusTone = "success" | "error" | "warning" | "info";

type FormStatusMessageProps = {
  tone?: FormStatusTone;
  title?: string;
  children: ReactNode;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toneClasses(tone: FormStatusTone) {
  switch (tone) {
    case "success":
      return "border-emerald-300/20 bg-emerald-950/25 text-emerald-50";
    case "error":
      return "border-red-300/20 bg-red-950/25 text-red-50";
    case "warning":
      return "border-amber-300/20 bg-amber-950/25 text-amber-50";
    case "info":
    default:
      return "border-white/12 bg-white/[0.045] text-white";
  }
}

function toneDotClasses(tone: FormStatusTone) {
  switch (tone) {
    case "success":
      return "bg-emerald-300";
    case "error":
      return "bg-red-300";
    case "warning":
      return "bg-amber-300";
    case "info":
    default:
      return "bg-[#D4A017]";
  }
}

export function FormStatusMessage({
  tone = "info",
  title,
  children,
  className,
}: FormStatusMessageProps) {
  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 shadow-lg shadow-black/10",
        toneClasses(tone),
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className={cx("mt-2 h-2 w-2 shrink-0 rounded-full", toneDotClasses(tone))} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cx(title ? "mt-0.5 text-current/72" : "text-current/78")}>{children}</div>
      </div>
    </div>
  );
}
