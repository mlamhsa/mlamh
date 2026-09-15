import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const SIZE = { width: 1600, height: 1000 };
const GOLD = "rgba(216,181,91,.76)";
const GOLD_SOFT = "rgba(216,181,91,.16)";
const LINE = "rgba(255,255,255,.20)";
const LINE_SOFT = "rgba(255,255,255,.10)";

function hash(input: string) {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) value = (value * 31 + input.charCodeAt(index)) >>> 0;
  return value;
}

function motifFor(input: string, audience: string, type: string) {
  const value = input.toLowerCase();
  if (/self.?tape|سيلف.?تيب/.test(value)) return "self-tape";
  if (/showreel|شوريل|فيديو.?تعريف/.test(value)) return "showreel";
  if (/report|insight|data|market|trend|تقرير|بيانات|سوق|اتجاه|رؤية/.test(value)) return "insight";
  if (/story|interview|journey|قصة|مقابلة|رحلة/.test(value)) return "story";
  if (/audition|acting|actor|تمثيل|ممثل|اختبار.?أداء|تجربة.?أداء/.test(value)) return "audition";
  if (/photo|image|portfolio|model|صورة|صور|مودل|معرض/.test(value)) return "portrait";
  if (/chat|message|quick|محادث|رسائل|سريع/.test(value)) return "conversation";
  if (/brief|publisher|shortlist|review|opportunity|ناشر|طلب|متقدم|اختيار|فرصة/.test(value)) return "workflow";
  if (/casting.?call|كاستينغ|كاستنج|production|إنتاج|صناعة|تصوير/.test(value) || type === "industry") return "production";
  if (audience === "publisher") return "workflow";
  if (audience === "talent") return "portrait";
  return "editorial";
}

function Person({ x, mirror = false, seated = false, gold = false }: { x: number; mirror?: boolean; seated?: boolean; gold?: boolean }) {
  const stroke = gold ? GOLD : LINE;
  return (
    <g transform={`translate(${x} 0)${mirror ? " scale(-1 1) translate(-170 0)" : ""}`} fill="none" stroke={stroke} strokeWidth="3">
      <ellipse cx="85" cy="105" rx="42" ry="48" />
      <path d="M54 83 Q85 55 117 79" stroke={GOLD} strokeWidth="5" />
      <path d="M73 153 L73 180 M98 153 L98 180" />
      <path d="M36 198 Q85 168 134 198 L145 305 L25 305 Z" fill={gold ? "rgba(216,181,91,.035)" : "rgba(255,255,255,.012)"} />
      <path d="M38 216 L2 264 M132 216 L168 264" />
      {seated ? <path d="M28 305 L84 338 L152 337 M84 338 L117 397" /> : <path d="M54 305 L48 398 M112 305 L120 398" />}
    </g>
  );
}

function Portrait() {
  return (
    <g fill="none">
      <circle cx="350" cy="225" r="150" fill={GOLD_SOFT} />
      <circle cx="350" cy="225" r="205" stroke={LINE_SOFT} strokeWidth="2" />
      <path d="M292 125 Q354 76 411 125 Q438 156 423 219 Q411 266 371 286 L371 325" stroke={GOLD} strokeWidth="4" />
      <path d="M295 126 Q275 192 294 252 Q311 285 335 291 L335 325" stroke={LINE} strokeWidth="3" />
      <path d="M335 325 Q350 353 371 325 Q448 339 489 407 M335 325 Q256 339 215 407" stroke={LINE} strokeWidth="3" />
      <path d="M303 139 Q355 96 410 135" stroke={GOLD} strokeWidth="6" />
      <path d="M388 184 Q406 189 416 198 M389 229 Q405 235 416 229" stroke={LINE} strokeWidth="2" />
    </g>
  );
}

function Motif({ kind, seed }: { kind: string; seed: number }) {
  const nudge = (seed % 17) - 8;

  if (kind === "portrait" || kind === "editorial") {
    return <svg width="700" height="520" viewBox="0 0 700 520"><Portrait /></svg>;
  }

  if (kind === "self-tape") {
    return (
      <svg width="760" height="520" viewBox="0 0 760 520">
        <circle cx="390" cy="245" r="180" fill={GOLD_SOFT} />
        <Person x={170 + nudge} gold />
        <rect x="500" y="126" width="118" height="205" rx="24" fill="rgba(7,7,7,.8)" stroke={GOLD} strokeWidth="3" />
        <circle cx="559" cy="205" r="34" fill="none" stroke={LINE} strokeWidth="3" />
        <path d="M559 331 L559 444 M505 444 L613 444" stroke={LINE} strokeWidth="3" />
      </svg>
    );
  }

  if (kind === "audition") {
    return (
      <svg width="760" height="520" viewBox="0 0 760 520">
        <circle cx="380" cy="210" r="175" fill={GOLD_SOFT} />
        <Person x={295 + nudge} gold />
        <path d="M115 125 L279 222 M645 125 L481 222" stroke={LINE_SOFT} strokeWidth="3" />
        <path d="M125 426 L635 426" stroke={GOLD} strokeOpacity=".45" strokeWidth="3" />
      </svg>
    );
  }

  if (kind === "showreel") {
    return (
      <svg width="780" height="520" viewBox="0 0 780 520">
        {[95, 300, 505].map((x, i) => (
          <g key={x}>
            <rect x={x} y={i === 1 ? 100 : 128} width="180" height="250" rx="26" fill={i === 1 ? "rgba(216,181,91,.04)" : "rgba(255,255,255,.01)"} stroke={i === 1 ? GOLD : LINE} strokeWidth={i === 1 ? 3 : 2} />
            <circle cx={x + 90} cy={i === 1 ? 178 : 206} r="38" fill="none" stroke={i === 1 ? GOLD : LINE} strokeWidth="3" />
            <path d={`M${x + 42} ${i === 1 ? 315 : 343} Q${x + 90} ${i === 1 ? 258 : 286} ${x + 138} ${i === 1 ? 315 : 343}`} fill="none" stroke={i === 1 ? GOLD : LINE} strokeWidth="3" />
          </g>
        ))}
      </svg>
    );
  }

  if (kind === "conversation" || kind === "story") {
    return (
      <svg width="800" height="520" viewBox="0 0 800 520">
        <Person x={82} seated gold={kind === "story"} />
        <Person x={548} seated mirror gold={kind !== "story"} />
        <ellipse cx="400" cy="392" rx="78" ry="25" fill="none" stroke={LINE} strokeWidth="3" />
        <path d="M322 392 L322 450 M478 392 L478 450" stroke={LINE_SOFT} strokeWidth="3" />
        <circle cx="400" cy="344" r="34" fill={GOLD_SOFT} stroke={GOLD} strokeWidth="2" />
      </svg>
    );
  }

  if (kind === "workflow") {
    return (
      <svg width="800" height="520" viewBox="0 0 800 520">
        {[90, 310, 530].map((x, i) => (
          <g key={x}>
            <rect x={x} y={i === 1 ? 92 : 124} width="180" height="270" rx="28" fill={i === 1 ? "rgba(216,181,91,.04)" : "rgba(255,255,255,.01)"} stroke={i === 1 ? GOLD : LINE} strokeWidth={i === 1 ? 3 : 2} />
            <circle cx={x + 90} cy={i === 1 ? 174 : 206} r="39" fill="none" stroke={i === 1 ? GOLD : LINE} strokeWidth="3" />
            <path d={`M${x + 42} ${i === 1 ? 300 : 332} Q${x + 90} ${i === 1 ? 244 : 276} ${x + 138} ${i === 1 ? 300 : 332}`} fill="none" stroke={i === 1 ? GOLD : LINE} strokeWidth="3" />
            <line x1={x + 52} y1={i === 1 ? 334 : 366} x2={x + 128} y2={i === 1 ? 334 : 366} stroke={i === 1 ? GOLD : LINE_SOFT} strokeWidth="7" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );
  }

  if (kind === "production") {
    return (
      <svg width="800" height="520" viewBox="0 0 800 520">
        <Person x={475} mirror gold />
        <rect x="130" y="168" width="205" height="146" rx="24" fill="rgba(255,255,255,.01)" stroke={LINE} strokeWidth="3" />
        <circle cx="230" cy="241" r="42" fill="none" stroke={GOLD} strokeWidth="4" />
        <path d="M335 202 L422 164 L422 315 L335 278 Z" fill={GOLD_SOFT} stroke={GOLD} strokeWidth="2" />
        <path d="M230 315 L230 432 M166 432 L294 432" stroke={LINE} strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg width="800" height="520" viewBox="0 0 800 520">
      <Person x={92} gold />
      <rect x="430" y="120" width="290" height="280" rx="30" fill="rgba(255,255,255,.01)" stroke={LINE} strokeWidth="2" />
      {[95, 155, 220].map((height, i) => <rect key={height} x={475 + i * 70} y={350 - height} width="42" height={height} rx="10" fill={i === 2 ? GOLD_SOFT : "none"} stroke={i === 2 ? GOLD : LINE} strokeWidth="3" />)}
    </svg>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "scene";
  const title = searchParams.get("title") || slug;
  const audience = searchParams.get("audience") || "all";
  const type = searchParams.get("type") || "guide";
  const seed = hash(`${slug}:${title}:${audience}:${type}`);
  const motif = motifFor(`${slug} ${title}`, audience, type);
  const offsetX = (seed % 31) - 15;
  const offsetY = ((seed >>> 8) % 21) - 10;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#070707", color: "white" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 52% 52%, rgba(216,181,91,.055), transparent 38%)" }} />
      <div style={{ position: "absolute", width: 780, height: 780, border: "2px solid rgba(216,181,91,.08)", borderRadius: 999, right: -185, top: -275 }} />
      <div style={{ position: "absolute", left: 72, top: 70, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 48, height: 2, background: "rgba(216,181,91,.72)" }} />
        <div style={{ fontSize: 18, letterSpacing: 8, color: "rgba(216,181,91,.72)" }}>MLAMH SCENE</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(${offsetX}px, ${offsetY + 38}px)` }}>
        <Motif kind={motif} seed={seed} />
      </div>
    </div>,
    SIZE,
  );
}
