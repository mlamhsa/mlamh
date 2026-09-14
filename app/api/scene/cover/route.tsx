import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const SIZE = { width: 1600, height: 1000 };

function hash(input: string) {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0;
  }
  return value;
}

function motifFor(input: string, audience: string, type: string) {
  const value = input.toLowerCase();
  if (/self.?tape|سيلف.?تيب/.test(value)) return "self-tape";
  if (/showreel|شوريل|فيديو.?تعريف/.test(value)) return "showreel";
  if (/audition|acting|actor|تمثيل|ممثل|اختبار.?أداء|تجربة.?أداء/.test(value)) return "audition";
  if (/photo|image|portfolio|model|صورة|صور|مودل|معرض/.test(value)) return "portrait";
  if (/chat|message|quick|محادث|رسائل|سريع/.test(value)) return "conversation";
  if (/brief|publisher|shortlist|review|ناشر|طلب|متقدم|اختيار/.test(value)) return "workflow";
  if (/casting.?call|كاستينغ|كاستنج|production|إنتاج|صناعة/.test(value) || type === "industry") return "production";
  if (audience === "publisher") return "workflow";
  if (audience === "talent") return "portrait";
  return "editorial";
}

function Motif({ kind, seed }: { kind: string; seed: number }) {
  const shift = (seed % 25) - 12;

  if (kind === "self-tape") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 560, height: 520, position: "relative" }}>
        <div style={{ width: 220, height: 390, border: "3px solid rgba(216,181,91,.58)", borderRadius: 34, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${shift / 6}deg)` }}>
          <div style={{ width: 150, height: 230, border: "2px solid rgba(255,255,255,.2)", borderRadius: 22 }} />
        </div>
        <div style={{ position: "absolute", left: 52, width: 96, height: 96, border: "2px solid rgba(255,255,255,.15)", borderRadius: 999 }} />
        <div style={{ position: "absolute", right: 58, width: 118, height: 2, background: "rgba(216,181,91,.35)", transform: "rotate(-38deg)" }} />
      </div>
    );
  }

  if (kind === "audition") {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: 600, height: 520, position: "relative" }}>
        <div style={{ position: "absolute", top: 18, width: 280, height: 280, borderRadius: 999, background: "radial-gradient(circle, rgba(216,181,91,.22), rgba(216,181,91,0) 70%)" }} />
        <div style={{ width: 96, height: 210, border: "2px solid rgba(255,255,255,.24)", borderRadius: "48px 48px 20px 20px", marginBottom: 70 }} />
        <div style={{ position: "absolute", bottom: 48, width: 410, height: 2, background: "rgba(216,181,91,.38)" }} />
        <div style={{ position: "absolute", top: 74, left: 96, width: 150, height: 2, background: "rgba(255,255,255,.12)", transform: "rotate(34deg)" }} />
        <div style={{ position: "absolute", top: 74, right: 96, width: 150, height: 2, background: "rgba(255,255,255,.12)", transform: "rotate(-34deg)" }} />
      </div>
    );
  }

  if (kind === "showreel") {
    return (
      <div style={{ display: "flex", gap: 18, alignItems: "center", justifyContent: "center", width: 600, height: 500, transform: `rotate(${shift / 8}deg)` }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 150, height: 230, border: i === 1 ? "3px solid rgba(216,181,91,.5)" : "2px solid rgba(255,255,255,.15)", borderRadius: 24, background: i === 1 ? "rgba(216,181,91,.06)" : "rgba(255,255,255,.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: i === 1 ? "40px solid rgba(216,181,91,.55)" : "40px solid rgba(255,255,255,.16)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (kind === "portrait") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 560, height: 520, position: "relative" }}>
        <div style={{ width: 270, height: 360, border: "2px solid rgba(216,181,91,.38)", borderRadius: 150, transform: `translateX(${shift}px)` }} />
        <div style={{ position: "absolute", width: 400, height: 400, border: "2px solid rgba(255,255,255,.11)", borderRadius: 999 }} />
        <div style={{ position: "absolute", bottom: 58, width: 190, height: 2, background: "rgba(216,181,91,.42)" }} />
      </div>
    );
  }

  if (kind === "workflow") {
    return (
      <div style={{ display: "flex", gap: 26, alignItems: "center", justifyContent: "center", width: 560, height: 500 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 145, height: 250 + i * 30, border: "2px solid rgba(255,255,255,.16)", borderRadius: 26, transform: `translateY(${(i - 1) * 24}px) rotate(${(i - 1) * 2}deg)`, background: i === 1 ? "rgba(216,181,91,.10)" : "rgba(255,255,255,.025)", display: "flex", flexDirection: "column", padding: 24, gap: 18 }}>
            <div style={{ width: "58%", height: 9, borderRadius: 99, background: "rgba(216,181,91,.55)" }} />
            <div style={{ width: "100%", height: 7, borderRadius: 99, background: "rgba(255,255,255,.16)" }} />
            <div style={{ width: "78%", height: 7, borderRadius: 99, background: "rgba(255,255,255,.10)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (kind === "conversation") {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: 560, gap: 30, transform: `translateX(${shift}px)` }}>
        <div style={{ width: 390, height: 120, alignSelf: "flex-end", border: "2px solid rgba(216,181,91,.34)", borderRadius: "34px 34px 8px 34px", background: "rgba(216,181,91,.07)" }} />
        <div style={{ width: 450, height: 138, border: "2px solid rgba(255,255,255,.14)", borderRadius: "34px 34px 34px 8px", background: "rgba(255,255,255,.025)" }} />
      </div>
    );
  }

  if (kind === "production") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 560, height: 500, position: "relative" }}>
        <div style={{ width: 320, height: 220, border: "3px solid rgba(255,255,255,.16)", borderRadius: 30, transform: `rotate(${-6 + shift / 8}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 180, height: 80, borderTop: "20px solid rgba(216,181,91,.45)", borderBottom: "20px solid rgba(216,181,91,.18)" }} />
        </div>
        <div style={{ position: "absolute", width: 470, height: 2, background: "rgba(216,181,91,.22)", transform: "rotate(34deg)" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 540, height: 540, position: "relative" }}>
      <div style={{ width: 310, height: 390, border: "2px solid rgba(216,181,91,.36)", borderRadius: 160 }} />
      <div style={{ position: "absolute", width: 410, height: 410, border: "2px solid rgba(255,255,255,.11)", borderRadius: 999 }} />
      <div style={{ position: "absolute", width: 170, height: 170, background: "rgba(216,181,91,.10)", borderRadius: 999 }} />
    </div>
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
  const x = 12 + (seed % 54);
  const y = 8 + ((seed >>> 8) % 52);
  const rotate = -18 + ((seed >>> 16) % 36);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#070707", color: "white" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${x}% ${y}%, rgba(216,181,91,.22), transparent 34%), radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(255,255,255,.065), transparent 30%)` }} />
        <div style={{ position: "absolute", width: 760, height: 760, border: "2px solid rgba(216,181,91,.08)", borderRadius: 999, right: -170, top: -240, transform: `rotate(${rotate}deg)` }} />
        <div style={{ position: "absolute", left: 74, top: 68, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 48, height: 2, background: "rgba(216,181,91,.65)" }} />
          <div style={{ fontSize: 18, letterSpacing: 8, color: "rgba(216,181,91,.65)" }}>MLAMH SCENE</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(${(seed % 31) - 15}px, ${((seed >>> 4) % 25) - 12}px)` }}>
          <Motif kind={motif} seed={seed} />
        </div>
        <div style={{ position: "absolute", left: 74, bottom: 58, width: 320, height: 1, background: "rgba(255,255,255,.10)" }} />
      </div>
    ),
    SIZE,
  );
}
