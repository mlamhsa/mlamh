"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";

type CreativeFormat = "vertical" | "feed";

type OpportunitySocialCreativeProps = {
  title: string;
  slug: string;
  city?: string | null;
  opportunityType?: string | null;
  compensation?: string | null;
};

export default function OpportunitySocialCreative({
  title,
  slug,
  city,
  opportunityType,
  compensation,
}: OpportunitySocialCreativeProps) {
  const [format, setFormat] = useState<CreativeFormat>("vertical");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const creativeRef = useRef<HTMLDivElement>(null);

  const opportunityUrl = useMemo(() => {
    return `https://mlamh.net/ar/opportunities/${slug}`;
  }, [slug]);

  useEffect(() => {
    let active = true;

    async function generateQr() {
      try {
        const dataUrl = await QRCode.toDataURL(opportunityUrl, {
          width: 420,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });

        if (active) setQrDataUrl(dataUrl);
      } catch (error) {
        console.error("[OpportunitySocialCreative.QR]", error);
      }
    }

    void generateQr();
    return () => { active = false; };
  }, [opportunityUrl]);

  const dimensions = format === "vertical"
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1350 };

  const previewScale = 0.28;
  const previewDimensions = {
    width: dimensions.width * previewScale,
    height: dimensions.height * previewScale,
  };

  async function handleDownload() {
    if (!creativeRef.current) return;

    try {
      const dataUrl = await toPng(creativeRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: "#050505",
      });

      const link = document.createElement("a");
      link.download = `mlamh-opportunity-${slug}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("[OpportunitySocialCreative.download]", error);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setFormat("vertical")} className={["rounded-full border px-5 py-3 text-sm transition", format === "vertical" ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-white/55 hover:border-gold/30"].join(" ")}>
          Story / Reel / TikTok
        </button>
        <button type="button" onClick={() => setFormat("feed")} className={["rounded-full border px-5 py-3 text-sm transition", format === "feed" ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-white/55 hover:border-gold/30"].join(" ")}>
          Instagram Feed
        </button>
        <button type="button" onClick={handleDownload} className="rounded-full border border-gold/40 px-5 py-3 text-sm text-gold transition hover:bg-gold hover:text-black">
          تنزيل PNG
        </button>
      </div>

      <div className="flex justify-center rounded-3xl border border-white/10 bg-black/50 p-6">
        <div dir="ltr" className="relative shrink-0 overflow-hidden" style={{ width: previewDimensions.width, height: previewDimensions.height }}>
          <div className="absolute left-0 top-0" style={{ width: dimensions.width, height: dimensions.height, transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
            <div ref={creativeRef} dir="rtl" style={{ width: dimensions.width, height: dimensions.height }} className="relative overflow-hidden bg-[#050505] text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(210,176,107,0.09),transparent_32%),radial-gradient(circle_at_12%_88%,rgba(210,176,107,0.04),transparent_28%)]" />
              <div className="absolute inset-[38px] border border-white/[0.035]" />

              <div className="relative grid h-full grid-rows-[320px_1fr_500px] px-[82px] py-[70px]">
                <header className="flex flex-col items-center justify-center">
                  <img
                    src="/brand/mlamh.svg"
                    alt="MLAMH"
                    width={560}
                    height={294}
                    className="h-[210px] w-[560px] object-contain"
                    crossOrigin="anonymous"
                  />
                  <div className="mt-5 flex items-center gap-5">
                    <div className="h-px w-[90px] bg-gradient-to-r from-transparent to-[#d2b06b]/50" />
                    <p className="text-[22px] font-medium tracking-[0.08em] text-[#d2b06b]">فرصة جديدة</p>
                    <div className="h-px w-[90px] bg-gradient-to-l from-transparent to-[#d2b06b]/50" />
                  </div>
                </header>

                <main className="flex flex-col items-center justify-center text-center">
                  <p className="mb-7 text-[21px] tracking-[0.16em] text-white/28">CASTING CALL</p>
                  <h1 className="mx-auto max-w-[900px] text-[98px] font-light leading-[1.12] tracking-[-0.035em] text-white">{title}</h1>
                  <div className="mt-14 flex items-center justify-center gap-7 text-[29px]">
                    {city ? <span className="text-white/65">{city}</span> : null}
                    {city && opportunityType ? <span className="text-[#d2b06b]/45">/</span> : null}
                    {opportunityType ? <span className="text-white/65">{opportunityType}</span> : null}
                    {(city || opportunityType) && compensation ? <span className="text-[#d2b06b]/45">/</span> : null}
                    {compensation ? <span className="font-medium text-emerald-300">{compensation}</span> : null}
                  </div>
                  <div className="mt-16 h-px w-[640px] bg-gradient-to-r from-transparent via-[#d2b06b]/40 to-transparent" />
                  <p className="mt-9 text-[24px] text-white/35">تفاصيل الفرصة ومتطلبات التقديم على ملامح</p>
                </main>

                <footer className="flex items-end">
                  <div className="w-full border-t border-white/[0.07] pt-12">
                    <div className="grid grid-cols-[1fr_330px] items-center gap-[72px]">
                      <div>
                        <p className="text-[48px] font-light leading-[1.32] tracking-[-0.02em]">مهتم بالفرصة؟<br />قدّم مباشرة عبر ملامح</p>
                        <p className="mt-7 max-w-[500px] text-[25px] leading-[1.75] text-white/38">امسح رمز QR لفتح صفحة الفرصة ومعرفة التفاصيل والتقديم.</p>
                        <div className="mt-8 flex items-center gap-4">
                          <span className="h-2 w-2 rounded-full bg-[#d2b06b]" />
                          <span className="text-[25px] tracking-[0.08em] text-[#d2b06b]">mlamh.net</span>
                        </div>
                      </div>
                      {qrDataUrl ? (
                        <div className="justify-self-end rounded-[24px] bg-white p-[14px]">
                          <img src={qrDataUrl} alt="Opportunity QR Code" className="h-[290px] w-[290px]" />
                        </div>
                      ) : (
                        <div className="h-[318px] w-[318px] justify-self-end animate-pulse rounded-[24px] bg-white/10" />
                      )}
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-white/35">الرابط المستخدم داخل QR: {opportunityUrl}</p>
    </section>
  );
}
