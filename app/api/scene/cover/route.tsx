import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { CSSProperties, ReactNode } from "react";

export const runtime = "edge";

const SIZE = { width: 1600, height: 1000 };
const GOLD = "#d8b55b";
const GOLD_LINE = "rgba(216,181,91,.78)";
const GOLD_SOFT = "rgba(216,181,91,.18)";
const WHITE_LINE = "rgba(255,255,255,.34)";
const WHITE_SOFT = "rgba(255,255,255,.14)";
const PANEL = "rgba(255,255,255,.035)";

type SceneKind =
  | "portrait"
  | "audition"
  | "wardrobe"
  | "beginner"
  | "self-tape"
  | "showreel"
  | "profile"
  | "workflow"
  | "decision"
  | "conversation"
  | "production"
  | "location"
  | "report"
  | "story"
  | "commerce"
  | "beauty"
  | "food"
  | "national-day"
  | "rights"
  | "call-sheet"
  | "roles"
  | "agency";

function hash(input: string) {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) value = (value * 31 + input.charCodeAt(index)) >>> 0;
  return value;
}

function sceneFor(slug: string, title: string, audience: string, type: string): SceneKind {
  const value = `${slug} ${title}`.toLowerCase();

  if (/what-to-wear-audition/.test(value)) return "wardrobe";
  if (/casting-without-experience/.test(value)) return "beginner";
  if (/self.?tape/.test(value)) return "self-tape";
  if (/showreel/.test(value)) return "showreel";
  if (/profile-readiness|profile-bio|complete-talent-profile|what-casting-team-looks-for|profile-photo|portfolio|model-portfolio|actor-portfolio|gallery/.test(value)) return "profile";
  if (/audition|acting|actor-vs-model|first-audition|casting-call-vs-audition|why-not-selected/.test(value)) return "audition";
  if (/shortlist|review-talent|select-right-talent|accept-reject|what-to-request|casting-requirements|brief/.test(value)) return "workflow";
  if (/quick-requests|chat-after|message|conversation/.test(value)) return "conversation";
  if (/location|travel|riyadh|city/.test(value)) return "location";
  if (/ecommerce|e-commerce|campaign|choose-model|request-actors-models/.test(value)) return "commerce";
  if (/beauty|salon|clinic/.test(value)) return "beauty";
  if (/restaurant|cafe/.test(value)) return "food";
  if (/national-day/.test(value)) return "national-day";
  if (/buyout|usage-rights/.test(value)) return "rights";
  if (/call-sheet/.test(value)) return "call-sheet";
  if (/lead-supporting-extra|role-types/.test(value)) return "roles";
  if (/agency-vs-casting-platform/.test(value)) return "agency";
  if (/story|norah|red-sea-production-market/.test(value) || type === "story") return "story";
  if (/report|box-office|film-incentives|creative-industries|market|confex|ecosystem/.test(value) || type === "report") return "report";
  if (/production|filming|shoot|film-production|casting-process/.test(value) || type === "industry") return "production";
  if (/model|photo|portrait/.test(value)) return "portrait";
  if (audience === "publisher") return "decision";
  if (audience === "talent") return "portrait";
  return "production";
}

function Figure({
  x = 0,
  y = 0,
  scale = 1,
  accent = false,
  facing = "right",
}: {
  x?: number;
  y?: number;
  scale?: number;
  accent?: boolean;
  facing?: "left" | "right";
}) {
  const line = accent ? GOLD_LINE : WHITE_LINE;
  const flip = facing === "left" ? -1 : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 180, height: 350, display: "flex", transform: `scale(${scale * flip}, ${scale})`, transformOrigin: "center" }}>
      <div style={{ position: "absolute", left: 59, top: 4, width: 64, height: 72, border: `5px solid ${line}`, borderRadius: 36, background: accent ? "rgba(216,181,91,.05)" : "rgba(255,255,255,.02)" }} />
      <div style={{ position: "absolute", left: 48, top: 12, width: 82, height: 26, borderTop: `8px solid ${GOLD_LINE}`, borderRadius: "55%" }} />
      <div style={{ position: "absolute", left: 50, top: 84, width: 82, height: 142, border: `5px solid ${line}`, borderRadius: "34px 34px 18px 18px", background: accent ? "rgba(216,181,91,.045)" : "rgba(255,255,255,.018)" }} />
      <div style={{ position: "absolute", left: 9, top: 116, width: 58, height: 5, borderRadius: 8, background: line, transform: "rotate(-32deg)" }} />
      <div style={{ position: "absolute", left: 116, top: 116, width: 58, height: 5, borderRadius: 8, background: line, transform: "rotate(32deg)" }} />
      <div style={{ position: "absolute", left: 63, top: 224, width: 5, height: 112, borderRadius: 8, background: line, transform: "rotate(5deg)" }} />
      <div style={{ position: "absolute", left: 113, top: 224, width: 5, height: 112, borderRadius: 8, background: line, transform: "rotate(-5deg)" }} />
    </div>
  );
}

function Card({ x, y, w = 190, h = 260, active = false, children }: { x: number; y: number; w?: number; h?: number; active?: boolean; children?: ReactNode }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, display: "flex", border: `4px solid ${active ? GOLD_LINE : WHITE_SOFT}`, borderRadius: 32, background: active ? "rgba(216,181,91,.065)" : PANEL }}>
      {children}
    </div>
  );
}

function MiniProfile({ active = false }: { active?: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
      <div style={{ position: "absolute", left: "50%", top: 38, width: 70, height: 70, marginLeft: -35, borderRadius: 40, border: `4px solid ${active ? GOLD_LINE : WHITE_LINE}` }} />
      <div style={{ position: "absolute", left: 38, right: 38, top: 130, height: 8, borderRadius: 10, background: active ? GOLD_LINE : WHITE_SOFT }} />
      <div style={{ position: "absolute", left: 54, right: 54, top: 158, height: 8, borderRadius: 10, background: WHITE_SOFT }} />
    </div>
  );
}

function Scene({ kind, seed }: { kind: SceneKind; seed: number }) {
  const shift = (seed % 31) - 15;
  const wrap: CSSProperties = { position: "relative", width: 900, height: 590, display: "flex" };

  if (kind === "portrait") {
    return (
      <div style={wrap}>
        <div style={{ position: "absolute", left: 268, top: 72, width: 330, height: 330, borderRadius: 180, background: GOLD_SOFT, border: `3px solid ${GOLD_LINE}` }} />
        <Figure x={342 + shift} y={110} scale={1.12} accent />
        <Card x={90} y={245} w={165} h={215}><MiniProfile /></Card>
        <Card x={640} y={218} w={165} h={215} active><MiniProfile active /></Card>
      </div>
    );
  }

  if (kind === "audition" || kind === "beginner") {
    return (
      <div style={wrap}>
        <div style={{ position: "absolute", left: 278, top: 52, width: 330, height: 330, borderRadius: 180, background: GOLD_SOFT }} />
        <div style={{ position: "absolute", left: 86, top: 120, width: 250, height: 4, background: WHITE_SOFT, transform: "rotate(30deg)" }} />
        <div style={{ position: "absolute", right: 86, top: 120, width: 250, height: 4, background: WHITE_SOFT, transform: "rotate(-30deg)" }} />
        <Figure x={350 + shift} y={132} scale={1.12} accent />
        {kind === "beginner" ? <div style={{ position: "absolute", right: 115, top: 320, width: 170, height: 80, border: `4px solid ${GOLD_LINE}`, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color: GOLD }}>START</div> : null}
      </div>
    );
  }

  if (kind === "wardrobe") {
    return (
      <div style={wrap}>
        <Figure x={350 + shift} y={120} scale={1.08} accent />
        <div style={{ position: "absolute", left: 145, top: 160, width: 150, height: 4, background: WHITE_LINE }} />
        <div style={{ position: "absolute", left: 218, top: 160, width: 4, height: 185, background: WHITE_LINE }} />
        <div style={{ position: "absolute", left: 165, top: 210, width: 105, height: 120, border: `4px solid ${GOLD_LINE}`, borderRadius: "42px 42px 18px 18px", background: "rgba(216,181,91,.05)" }} />
        <div style={{ position: "absolute", right: 135, top: 176, width: 180, height: 250, border: `4px solid ${WHITE_SOFT}`, borderRadius: 30, background: PANEL }} />
        <div style={{ position: "absolute", right: 178, top: 217, width: 92, height: 92, borderRadius: 50, border: `4px solid ${WHITE_LINE}` }} />
        <div style={{ position: "absolute", right: 167, top: 335, width: 114, height: 10, borderRadius: 8, background: GOLD_LINE }} />
      </div>
    );
  }

  if (kind === "self-tape") {
    return (
      <div style={wrap}>
        <Figure x={248 + shift} y={125} scale={1.08} accent />
        <div style={{ position: "absolute", right: 145, top: 105, width: 190, height: 320, borderRadius: 38, border: `5px solid ${GOLD_LINE}`, background: "rgba(7,7,7,.8)", display: "flex" }}>
          <div style={{ position: "absolute", left: 58, top: 68, width: 74, height: 74, borderRadius: 42, border: `4px solid ${WHITE_LINE}` }} />
          <div style={{ position: "absolute", left: 40, right: 40, top: 175, height: 8, background: WHITE_SOFT, borderRadius: 8 }} />
        </div>
        <div style={{ position: "absolute", right: 239, top: 425, width: 4, height: 90, background: WHITE_LINE }} />
        <div style={{ position: "absolute", right: 195, top: 508, width: 90, height: 4, background: WHITE_LINE }} />
        <div style={{ position: "absolute", left: 120, top: 192, width: 120, height: 120, borderRadius: 70, border: `4px solid ${WHITE_SOFT}` }} />
      </div>
    );
  }

  if (kind === "showreel") {
    return (
      <div style={wrap}>
        {[95, 330, 565].map((x, index) => (
          <Card key={x} x={x} y={index === 1 ? 110 : 150} w={210} h={300} active={index === 1}>
            <MiniProfile active={index === 1} />
            <div style={{ position: "absolute", left: 82, top: 205, width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: `44px solid ${index === 1 ? GOLD : "rgba(255,255,255,.25)"}` }} />
          </Card>
        ))}
      </div>
    );
  }

  if (kind === "profile") {
    return (
      <div style={wrap}>
        <Figure x={160 + shift} y={125} scale={1.03} accent />
        <Card x={450} y={105} w={320} h={370} active>
          <div style={{ position: "absolute", left: 38, top: 38, width: 86, height: 86, borderRadius: 46, border: `4px solid ${GOLD_LINE}` }} />
          {[156, 206, 256].map((y, i) => <div key={y} style={{ position: "absolute", left: 42, right: 42 + i * 34, top: y, height: 10, borderRadius: 8, background: i === 2 ? WHITE_SOFT : GOLD_LINE }} />)}
          <div style={{ position: "absolute", right: 34, top: 34, width: 64, height: 64, borderRadius: 34, border: `4px solid ${GOLD_LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color: GOLD }}>✓</div>
        </Card>
      </div>
    );
  }

  if (kind === "workflow" || kind === "decision") {
    return (
      <div style={wrap}>
        {[80, 335, 590].map((x, index) => <Card key={x} x={x} y={index === 1 ? 105 : 150} w={220} h={320} active={index === 1}><MiniProfile active={index === 1} /></Card>)}
        <div style={{ position: "absolute", left: 386, top: 445, width: 118, height: 54, borderRadius: 28, background: GOLD_SOFT, border: `3px solid ${GOLD_LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: GOLD }}>✓</div>
      </div>
    );
  }

  if (kind === "conversation" || kind === "story") {
    return (
      <div style={wrap}>
        <Figure x={112 + shift} y={150} scale={.95} accent={kind === "story"} />
        <Figure x={610 - shift} y={150} scale={.95} accent={kind !== "story"} facing="left" />
        <div style={{ position: "absolute", left: 300, top: 120, width: 260, height: 105, border: `4px solid ${GOLD_LINE}`, borderRadius: "30px 30px 8px 30px", background: "rgba(216,181,91,.05)" }} />
        <div style={{ position: "absolute", left: 342, top: 258, width: 270, height: 112, border: `4px solid ${WHITE_SOFT}`, borderRadius: "30px 30px 30px 8px", background: PANEL }} />
      </div>
    );
  }

  if (kind === "location") {
    return (
      <div style={wrap}>
        <Figure x={145 + shift} y={142} scale={1.0} accent />
        <div style={{ position: "absolute", right: 150, top: 110, width: 330, height: 350, border: `4px solid ${WHITE_SOFT}`, borderRadius: 42, background: PANEL }} />
        <div style={{ position: "absolute", right: 255, top: 170, width: 120, height: 120, borderRadius: 70, border: `5px solid ${GOLD_LINE}` }} />
        <div style={{ position: "absolute", right: 297, top: 279, width: 36, height: 72, background: GOLD_SOFT, borderLeft: `4px solid ${GOLD_LINE}`, borderRight: `4px solid ${GOLD_LINE}` }} />
        <div style={{ position: "absolute", right: 210, top: 384, width: 210, height: 5, background: WHITE_LINE, transform: "rotate(-13deg)" }} />
      </div>
    );
  }

  if (kind === "report") {
    return (
      <div style={wrap}>
        <Figure x={100 + shift} y={150} scale={.98} accent />
        <Card x={420} y={95} w={360} h={390} active>
          {[120, 185, 255].map((h, i) => <div key={h} style={{ position: "absolute", left: 54 + i * 88, bottom: 55, width: 54, height: h, borderRadius: 15, border: `4px solid ${i === 2 ? GOLD_LINE : WHITE_LINE}`, background: i === 2 ? GOLD_SOFT : "rgba(255,255,255,.02)" }} />)}
        </Card>
      </div>
    );
  }

  if (kind === "production" || kind === "call-sheet" || kind === "rights" || kind === "roles" || kind === "agency") {
    return (
      <div style={wrap}>
        <Figure x={540 + shift} y={145} scale={.98} accent />
        <div style={{ position: "absolute", left: 100, top: 180, width: 280, height: 195, borderRadius: 32, border: `4px solid ${WHITE_LINE}`, background: PANEL }} />
        <div style={{ position: "absolute", left: 177, top: 235, width: 115, height: 115, borderRadius: 70, border: `5px solid ${GOLD_LINE}` }} />
        {kind === "call-sheet" ? <div style={{ position: "absolute", left: 125, top: 120, width: 220, height: 74, border: `4px solid ${GOLD_LINE}`, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color: GOLD }}>CALL</div> : null}
        {kind === "rights" ? <div style={{ position: "absolute", left: 120, top: 405, width: 260, height: 5, background: GOLD_LINE }} /> : null}
        {kind === "roles" ? <div style={{ position: "absolute", left: 112, top: 95, display: "flex", gap: 18 }}><div style={{ width: 55, height: 55, borderRadius: 30, border: `4px solid ${WHITE_LINE}` }} /><div style={{ width: 72, height: 72, borderRadius: 38, border: `4px solid ${GOLD_LINE}` }} /><div style={{ width: 48, height: 48, borderRadius: 28, border: `4px solid ${WHITE_LINE}` }} /></div> : null}
      </div>
    );
  }

  if (kind === "commerce" || kind === "beauty" || kind === "food" || kind === "national-day") {
    return (
      <div style={wrap}>
        <Figure x={310 + shift} y={130} scale={1.08} accent />
        <Card x={85} y={190} w={190} h={240}><MiniProfile /></Card>
        <Card x={625} y={175} w={190} h={240} active><MiniProfile active /></Card>
        {kind === "beauty" ? <div style={{ position: "absolute", left: 680, top: 105, width: 80, height: 80, borderRadius: 44, border: `4px solid ${GOLD_LINE}` }} /> : null}
        {kind === "food" ? <div style={{ position: "absolute", left: 105, top: 110, width: 145, height: 70, borderRadius: "0 0 70px 70px", border: `4px solid ${GOLD_LINE}` }} /> : null}
        {kind === "national-day" ? <div style={{ position: "absolute", left: 170, top: 110, width: 560, height: 5, background: GOLD_LINE }} /> : null}
      </div>
    );
  }

  return <div style={wrap}><Figure x={350} y={125} scale={1.05} accent /></div>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "scene";
  const title = searchParams.get("title") || slug;
  const audience = searchParams.get("audience") || "all";
  const type = searchParams.get("type") || "guide";
  const seed = hash(`${slug}:${title}:${audience}:${type}`);
  const scene = sceneFor(slug, title, audience, type);
  const horizontal = (seed % 29) - 14;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#060606", color: "white" }}>
      <div style={{ position: "absolute", width: 800, height: 800, border: "3px solid rgba(216,181,91,.10)", borderRadius: 999, right: -190, top: -290 }} />
      <div style={{ position: "absolute", left: 72, top: 70, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 48, height: 3, background: GOLD_LINE }} />
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 8, color: GOLD_LINE }}>MLAMH SCENE</div>
      </div>
      <div style={{ position: "absolute", left: 330 + horizontal, top: 205, width: 940, height: 610, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Scene kind={scene} seed={seed} />
      </div>
      <div style={{ position: "absolute", left: 74, bottom: 58, width: 300, height: 2, background: "rgba(255,255,255,.10)" }} />
    </div>,
    SIZE,
  );
}
