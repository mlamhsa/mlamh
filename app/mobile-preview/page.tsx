"use client";

import { useMemo, useState } from "react";

type Screen = "welcome" | "home" | "opportunity" | "applications" | "messages" | "profile" | "publisher";

const GOLD = "#D4A017";
const CHARCOAL = "#2E2E2E";
const IVORY = "#F5F1E8";
const BRONZE = "#8C6A2D";

export default function MobilePreviewPage() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [dark, setDark] = useState(true);

  const theme = useMemo(() => ({
    bg: dark ? CHARCOAL : IVORY,
    text: dark ? IVORY : CHARCOAL,
    muted: dark ? "rgba(245,241,232,.62)" : "rgba(46,46,46,.62)",
    surface: dark ? "rgba(245,241,232,.055)" : "rgba(46,46,46,.045)",
    border: dark ? "rgba(245,241,232,.13)" : "rgba(46,46,46,.13)",
  }), [dark]);

  return (
    <main style={{ minHeight: "100vh", background: "#111", padding: "28px 14px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "white" }}>
          <div>
            <div style={{ fontSize: 12, opacity: .55 }}>MLAMH Mobile</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Interactive UI Preview</div>
          </div>
          <button onClick={() => setDark(v => !v)} style={ghostButton}>{dark ? "Light" : "Dark"}</button>
        </div>

        <section style={{ position: "relative", width: "100%", minHeight: 820, overflow: "hidden", borderRadius: 38, border: "8px solid #202020", boxShadow: "0 28px 80px rgba(0,0,0,.45)", background: theme.bg, color: theme.text }}>
          <div style={{ height: 26, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: 96, height: 19, borderRadius: 20, background: "#151515" }} />
          </div>

          <div dir="rtl" style={{ padding: "8px 18px 104px" }}>
            {screen === "welcome" && <Welcome onStart={() => setScreen("home")} theme={theme} />}
            {screen === "home" && <Home onOpen={() => setScreen("opportunity")} theme={theme} />}
            {screen === "opportunity" && <Opportunity theme={theme} />}
            {screen === "applications" && <Applications theme={theme} />}
            {screen === "messages" && <Messages theme={theme} />}
            {screen === "profile" && <Profile theme={theme} />}
            {screen === "publisher" && <Publisher theme={theme} />}
          </div>

          {screen !== "welcome" && (
            <nav style={{ position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 82, borderTop: `1px solid ${theme.border}`, background: dark ? "rgba(46,46,46,.98)" : "rgba(245,241,232,.98)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", alignItems: "center", padding: "4px 10px 10px" }}>
              <Tab active={screen === "home"} label="الرئيسية" icon="⌂" onClick={() => setScreen("home")} theme={theme} />
              <Tab active={screen === "applications"} label="طلباتي" icon="✓" onClick={() => setScreen("applications")} theme={theme} />
              <button onClick={() => setScreen("publisher")} style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, margin: "-28px auto 1px", background: GOLD, display: "grid", placeItems: "center", color: CHARCOAL, fontSize: 28, fontWeight: 500, border: `4px solid ${theme.bg}` }}>+</div>
                <div style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>فرصة</div>
              </button>
              <Tab active={screen === "messages"} label="الرسائل" icon="✉" onClick={() => setScreen("messages")} theme={theme} />
              <Tab active={screen === "profile"} label="ملفي" icon="◉" onClick={() => setScreen("profile")} theme={theme} />
            </nav>
          )}
        </section>
        <p style={{ color: "rgba(255,255,255,.55)", fontSize: 12, lineHeight: 1.6, margin: "12px 4px 0" }}>هذه معاينة تفاعلية للواجهة والتنقل على فرع التطوير فقط، وليست Native Build أو إصدار متجر.</p>
      </div>
    </main>
  );
}

function Welcome({ onStart, theme }: any) {
  return <div style={{ minHeight: 680, display: "flex", flexDirection: "column", justifyContent: "center", gap: 34, textAlign: "center" }}>
    <div>
      <div style={{ color: GOLD, fontSize: 78, lineHeight: .9, fontWeight: 300 }}>M</div>
      <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: 2 }}>MLAMH</div>
      <div style={{ fontSize: 25, marginTop: 2 }}>ملامح</div>
      <div style={{ color: theme.muted, fontSize: 12, marginTop: 14 }}>منصة المواهب والفرص الإبداعية</div>
      <div style={{ width: 32, height: 2, background: GOLD, margin: "18px auto 0" }} />
    </div>
    <div>
      <h1 style={{ fontSize: 30, margin: 0 }}>اكتشف فرصك القادمة</h1>
      <p style={{ color: theme.muted, fontSize: 15 }}>وابنِ مستقبلك في عالم الإبداع</p>
    </div>
    <div style={{ display: "grid", gap: 10 }}>
      <button onClick={onStart} style={primaryButton}>إنشاء حساب</button>
      <button onClick={onStart} style={{ ...secondaryButton, color: theme.text }}>تسجيل الدخول</button>
      <button onClick={onStart} style={{ ...textButton, color: theme.muted }}>تصفح كضيف</button>
    </div>
  </div>
}

function Home({ onOpen, theme }: any) {
  return <div>
    <div style={rowBetween}><div style={{ fontWeight: 800 }}>⌖ السعودية <span style={{ color: GOLD }}>⌄</span></div><div style={{ fontSize: 22 }}>♧</div></div>
    <div style={{ ...inputBox, borderColor: theme.border, background: theme.surface, color: theme.muted }}>ابحث عن فرص، مواهب، شركات... <span>⌕</span></div>
    <div style={{ display: "flex", gap: 10, overflow: "hidden", margin: "18px 0" }}>{["الكل","تمثيل","مودل","تصوير","أخرى"].map((x,i)=><div key={x} style={{ minWidth: 58, textAlign: "center" }}><div style={{ width: 46, height: 46, borderRadius: 13, margin: "0 auto 6px", display: "grid", placeItems: "center", border: `1px solid ${i===0?GOLD:theme.border}`, background: i===0?GOLD:theme.surface, color: i===0?CHARCOAL:theme.text }}>✦</div><div style={{ fontSize: 10 }}>{x}</div></div>)}</div>
    <SectionTitle title="فرص مميزة" />
    <button onClick={onOpen} style={{ width: "100%", height: 250, position: "relative", overflow: "hidden", borderRadius: 22, border: `1px solid ${theme.border}`, padding: 0, background: theme.surface, color: theme.text, textAlign: "right", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 35%, rgba(212,160,23,.2), transparent 34%), linear-gradient(145deg, ${CHARCOAL}, #171717)` }} />
      <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 16, background: "linear-gradient(transparent,rgba(0,0,0,.92))" }}>
        <span style={pill}>مميز</span><h2 style={{ margin: "10px 0 5px", color: IVORY, fontSize: 20 }}>حملة إعلانية — نبحث عن مودلز</h2><div style={{ color: "rgba(245,241,232,.68)", fontSize: 11 }}>الرياض · السعودية</div><div style={{ color: IVORY, marginTop: 5, fontSize: 12 }}>1,500 ر.س</div>
      </div>
    </button>
    <SectionTitle title="فرص جديدة" />
    {["ممثل لإعلان رقمي","مودل لتصوير منتجات"].map((x,i)=><button key={x} onClick={onOpen} style={{ width: "100%", display: "flex", gap: 12, alignItems: "center", border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, borderRadius: 17, padding: 12, marginBottom: 9, cursor: "pointer", textAlign: "right" }}><div style={{ width: 82, height: 82, borderRadius: 14, background: `rgba(212,160,23,.${i?8:12})`, display: "grid", placeItems: "center", color: GOLD, fontSize: 28 }}>✦</div><div><b>{x}</b><div style={{ fontSize: 11, color: theme.muted, marginTop: 5 }}>MLAMH · الرياض</div><div style={{ color: GOLD, fontSize: 11, marginTop: 5 }}>عرض التفاصيل</div></div></button>)}
  </div>
}

function Opportunity({ theme }: any) { return <div>
  <div style={{ marginTop: 10, color: GOLD, fontSize: 12 }}>MLAMH · OPPORTUNITY</div>
  <div style={{ marginTop: 16, height: 260, borderRadius: 28, background: `radial-gradient(circle at 30% 30%, rgba(212,160,23,.2), transparent 35%), linear-gradient(145deg, #111, ${CHARCOAL})`, border: `1px solid ${theme.border}`, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", bottom: 18, right: 18, left: 18 }}><span style={pill}>مودل</span><h1 style={{ color: IVORY, fontSize: 28, margin: "12px 0 5px" }}>حملة إعلانية لعلامة أزياء</h1><div style={{ color: "rgba(245,241,232,.7)", fontSize: 12 }}>MLAMH · الرياض، السعودية</div></div></div>
  <div style={card(theme)}><h3>عن الفرصة</h3><p style={body(theme)}>تصوير حملة رقمية احترافية لعلامة أزياء. نبحث عن حضور قوي أمام الكاميرا ومرونة في التصوير.</p></div>
  <div style={card(theme)}><div style={rowBetween}><span style={{ color: theme.muted }}>المقابل</span><b>1,500 ر.س</b></div><div style={{ ...rowBetween, marginTop: 12 }}><span style={{ color: theme.muted }}>الموقع</span><b>الرياض</b></div></div>
  <button style={{ ...primaryButton, width: "100%", marginTop: 14 }}>تقدم الآن</button>
</div> }

function Applications({ theme }: any) { return <div><Header title="طلباتي" /><div style={{ display: "flex", gap: 8, marginBottom: 14 }}>{["الكل 3","قيد المراجعة 2","مقبول 1"].map((x,i)=><div key={x} style={{ flex:1,padding:12,borderRadius:16,border:`1px solid ${theme.border}`,background:i===2?"rgba(212,160,23,.12)":theme.surface,textAlign:"center",fontSize:11 }}>{x}</div>)}</div>{["حملة أزياء","إعلان تطبيق","تصوير منتجات"].map((x,i)=><div key={x} style={{ padding:"16px 4px", borderBottom:`1px solid ${theme.border}` }}><div style={{ color:i===0?GOLD:theme.muted,fontSize:11,fontWeight:800 }}>{i===0?"مقبول":"قيد المراجعة"}</div><h3 style={{ margin:"7px 0 4px" }}>{x}</h3><div style={{ color:theme.muted,fontSize:11 }}>MLAMH · الرياض</div>{i===0&&<button style={{ ...primaryButton, marginTop:12, width:"100%" }}>فتح المحادثة</button>}</div>)}</div> }

function Messages({ theme }: any) { return <div><Header title="الرسائل" />{["شركة مدار","MLAMH Casting","استوديو رؤى"].map((x,i)=><div key={x} style={{ display:"flex",gap:12,padding:"14px 0",borderBottom:`1px solid ${theme.border}`,alignItems:"center" }}><div style={{ width:50,height:50,borderRadius:25,border:`1px solid ${i===0?GOLD:theme.border}`,display:"grid",placeItems:"center",color:GOLD,fontWeight:800 }}>{x[0]}</div><div style={{ flex:1 }}><div style={rowBetween}><b>{x}</b><span style={{ color:theme.muted,fontSize:9 }}>10:2{i}</span></div><div style={{ color:GOLD,fontSize:10,marginTop:3 }}>حملة أزياء</div><div style={{ color:theme.muted,fontSize:12,marginTop:4 }}>{i===0?"تم قبولك، نقدر ننسق موعد التصوير.":"مرحبًا، راجعنا ملفك..."}</div></div>{i===0&&<div style={{ minWidth:22,height:22,borderRadius:11,background:GOLD,color:CHARCOAL,display:"grid",placeItems:"center",fontSize:10,fontWeight:900 }}>2</div>}</div>)}</div> }

function Profile({ theme }: any) { return <div><Header title="ملفي" /><div style={{ height:390,borderRadius:28,border:`1px solid ${theme.border}`,background:`radial-gradient(circle at 50% 30%, rgba(212,160,23,.18), transparent 34%), linear-gradient(#474747,#181818)`,position:"relative",overflow:"hidden" }}><div style={{ position:"absolute",right:18,left:18,bottom:18 }}><span style={pill}>مودل</span><h2 style={{ color:IVORY,fontSize:30,margin:"10px 0 5px" }}>سوسن محمد</h2><div style={{ color:"rgba(245,241,232,.7)",fontSize:12 }}>الرياض · SA</div></div></div><div style={card(theme)}><div style={rowBetween}><h3 style={{ margin:0 }}>جاهزية ملفك</h3><b style={{ color:GOLD,fontSize:22 }}>82%</b></div><div style={{ height:7,borderRadius:4,background:theme.border,overflow:"hidden",marginTop:12 }}><div style={{ width:"82%",height:"100%",background:GOLD }}/></div><p style={body(theme)}>أضف صورًا قوية ومهاراتك الأساسية لزيادة جودة ملفك.</p></div><SectionTitle title="الأعمال والصور" /><div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>{[1,2,3].map(i=><div key={i} style={{ aspectRatio:".76",borderRadius:18,background:`linear-gradient(145deg, rgba(212,160,23,.${i+5}), ${theme.surface})`,border:`1px solid ${theme.border}` }}/>)}</div></div> }

function Publisher({ theme }: any) { return <div><Header title="لوحة الجهة" /><div style={card(theme)}><div style={rowBetween}><div><div style={{ color:GOLD,fontSize:11,fontWeight:800 }}>MLAMH · OWNER</div><h2 style={{ margin:"7px 0 0" }}>شركة ملامح للإنتاج</h2></div><span style={pill}>معتمد</span></div></div><div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>{[["4","الفرص"],["37","المتقدمون"],["6","المقبولون"]].map(([n,l])=><div key={l} style={{ ...card(theme),padding:13,textAlign:"center" }}><b style={{ fontSize:25 }}>{n}</b><div style={{ color:theme.muted,fontSize:9 }}>{l}</div></div>)}</div><SectionTitle title="فرصي" />{["حملة أزياء","إعلان رقمي"].map((x,i)=><div key={x} style={{ ...card(theme),marginBottom:10 }}><div style={rowBetween}><b>{x}</b><span style={{ color:i===0?GOLD:BRONZE,fontSize:10 }}>{i===0?"منشورة":"قيد المراجعة"}</span></div><div style={{ color:theme.muted,fontSize:11,marginTop:7 }}>الرياض · 18 متقدم</div></div>)}</div> }

function Tab({ active, label, icon, onClick, theme }: any) { return <button onClick={onClick} style={{ border:0,background:"transparent",color:active?GOLD:theme.text,cursor:"pointer",display:"grid",gap:2,placeItems:"center" }}><div style={{ fontSize:20 }}>{icon}</div><div style={{ fontSize:10,fontWeight:active?800:500 }}>{label}</div></button> }
function Header({ title }: { title:string }) { return <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0 18px" }}><div><div style={{ color:GOLD,fontSize:11,fontWeight:900,letterSpacing:2 }}>MLAMH</div><h1 style={{ margin:"3px 0 0",fontSize:32 }}>{title}</h1></div><div style={{ width:44,height:44,borderRadius:22,border:`1px solid ${GOLD}`,display:"grid",placeItems:"center",color:GOLD,fontWeight:800 }}>م</div></div> }
function SectionTitle({ title }: { title:string }) { return <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 10px" }}><h3 style={{ margin:0,fontSize:18 }}>{title}</h3><span style={{ color:GOLD,fontSize:11 }}>عرض الكل</span></div> }

const rowBetween: React.CSSProperties = { display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 };
const inputBox: React.CSSProperties = { height:46,border:"1px solid",borderRadius:14,padding:"0 14px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,marginTop:12 };
const primaryButton: React.CSSProperties = { minHeight:52,border:0,borderRadius:16,background:GOLD,color:CHARCOAL,fontWeight:900,fontSize:15,cursor:"pointer",padding:"0 18px" };
const secondaryButton: React.CSSProperties = { minHeight:50,border:`1px solid ${GOLD}`,borderRadius:16,background:"transparent",fontWeight:800,fontSize:14,cursor:"pointer" };
const textButton: React.CSSProperties = { minHeight:40,border:0,background:"transparent",cursor:"pointer",fontSize:12 };
const ghostButton: React.CSSProperties = { border:"1px solid rgba(255,255,255,.2)",borderRadius:20,background:"transparent",color:"white",padding:"7px 12px",cursor:"pointer" };
const pill: React.CSSProperties = { display:"inline-block",background:GOLD,color:CHARCOAL,borderRadius:13,padding:"6px 10px",fontSize:10,fontWeight:900 };
function card(theme:any): React.CSSProperties { return { border:`1px solid ${theme.border}`,background:theme.surface,borderRadius:22,padding:17,marginTop:14 }; }
function body(theme:any): React.CSSProperties { return { color:theme.muted,fontSize:13,lineHeight:1.9,marginBottom:0 }; }
