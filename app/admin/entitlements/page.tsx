import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

import AdminEntitlementActions from "@/components/admin/entitlements/AdminEntitlementActions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = { searchParams: Promise<{ lang?: string }> };
type EntitlementRow = { id:number; user_id:string; product_id:number; payment_id:number|null; entitlement_code:string; target_type:string|null; target_id:string|null; status:string; starts_at:string|null; expires_at:string|null; created_at:string; revoked_at:string|null };
type ProductRow = { id:number; code:string; name_ar:string; name_en:string };
type PaymentRow = { id:number; amount_minor:number; currency:string; status:string; provider:string|null; provider_payment_id:string|null; succeeded_at:string|null; product_code_snapshot:string|null };
type TalentRow = { id:number; name_ar:string|null; name_en:string|null };
type OpportunityRow = { id:number; title:string|null };

const COMMERCIAL_PRODUCT_CODES = ["featured_talent", "featured_opportunity"] as const;

function formatDate(value:string|null, locale:string) {
  if (!value) return "—";
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale==="ar"?"ar-SA":"en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(date);
}
function remainingDays(expiresAt:string|null) {
  if(!expiresAt) return null;
  return Math.max(0,Math.ceil((new Date(expiresAt).getTime()-Date.now())/86_400_000));
}
function isActive(row:EntitlementRow) {
  const now=Date.now();
  if(row.status!=="active"||row.revoked_at) return false;
  if(row.starts_at&&new Date(row.starts_at).getTime()>now) return false;
  return !row.expires_at||new Date(row.expires_at).getTime()>now;
}
function money(minor:number,currency:string,locale:string){
  return new Intl.NumberFormat(locale==="ar"?"ar-SA":"en-US",{style:"currency",currency}).format(minorToMajorAmount(minor,currency));
}

export const metadata={title:"Subscriptions & Entitlements — MLAMH Admin",robots:{index:false,follow:false}};

export default async function AdminEntitlementsPage({searchParams}:PageProps){
  await requireAdminAccess();
  const {lang}=await searchParams;
  const locale=lang==="en"?"en":"ar";
  const isArabic=locale==="ar";
  const adminClient=createAdminClient();

  const {data:entitlementData,error}=await adminClient
    .from("entitlements")
    .select("id, user_id, product_id, payment_id, entitlement_code, target_type, target_id, status, starts_at, expires_at, created_at, revoked_at")
    .order("created_at",{ascending:false})
    .limit(100);
  if(error) throw new Error(`Unable to load entitlements: ${error.message}`);

  const rows=(entitlementData??[]) as EntitlementRow[];
  const productIds=[...new Set(rows.map(r=>r.product_id))];
  const paymentIds=[...new Set(rows.map(r=>r.payment_id).filter((v):v is number=>typeof v==="number"))];
  const talentIds=[...new Set(rows.filter(r=>r.target_type==="talent"&&r.target_id).map(r=>Number(r.target_id)).filter(v=>Number.isInteger(v)&&v>0))];
  const opportunityIds=[...new Set(rows.filter(r=>r.target_type==="opportunity"&&r.target_id).map(r=>Number(r.target_id)).filter(v=>Number.isInteger(v)&&v>0))];

  const productsById=new Map<number,ProductRow>();
  if(productIds.length){
    const {data}=await adminClient.from("payment_products").select("id, code, name_ar, name_en").in("id",productIds);
    for(const p of (data??[]) as ProductRow[]) productsById.set(p.id,p);
  }

  const paymentsById=new Map<number,PaymentRow>();
  if(paymentIds.length){
    const {data}=await adminClient.from("payments").select("id, amount_minor, currency, status, provider, provider_payment_id, succeeded_at, product_code_snapshot").in("id",paymentIds);
    for(const p of (data??[]) as PaymentRow[]) paymentsById.set(p.id,p);
  }

  const talentsById=new Map<number,TalentRow>();
  if(talentIds.length){
    const {data}=await adminClient.from("talents").select("id, name_ar, name_en").in("id",talentIds);
    for(const t of (data??[]) as TalentRow[]) talentsById.set(t.id,t);
  }

  const opportunitiesById=new Map<number,OpportunityRow>();
  if(opportunityIds.length){
    const {data}=await adminClient.from("opportunities").select("id, title").in("id",opportunityIds);
    for(const opportunity of (data??[]) as OpportunityRow[]) opportunitiesById.set(opportunity.id,opportunity);
  }

  const activeRows=rows.filter(isActive);
  const activeCount=activeRows.length;
  const expiredCount=rows.length-activeCount;
  const sevenDays=Date.now()+7*86_400_000;
  const expiringSoon=activeRows.filter(r=>r.expires_at&&new Date(r.expires_at).getTime()<=sevenDays).length;

  const {data:successfulPayments}=await adminClient
    .from("payments")
    .select("id, amount_minor, currency, status, succeeded_at, product_code_snapshot")
    .eq("status","succeeded")
    .eq("currency","SAR")
    .in("product_code_snapshot", [...COMMERCIAL_PRODUCT_CODES]);

  const paid=(successfulPayments??[]) as PaymentRow[];
  const revenueMinor=paid.reduce((s,p)=>s+Number(p.amount_minor||0),0);
  const monthStart=new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);
  const monthRevenueMinor=paid.filter(p=>p.succeeded_at&&new Date(p.succeeded_at)>=monthStart).reduce((s,p)=>s+Number(p.amount_minor||0),0);
  const featuredTalentRevenue=paid.filter(p=>p.product_code_snapshot==="featured_talent").reduce((s,p)=>s+Number(p.amount_minor||0),0);
  const featuredOpportunityRevenue=paid.filter(p=>p.product_code_snapshot==="featured_opportunity").reduce((s,p)=>s+Number(p.amount_minor||0),0);
  const activeFeaturedTalents=activeRows.filter(r=>r.entitlement_code==="featured_talent").length;
  const activeFeaturedOpportunities=activeRows.filter(r=>r.entitlement_code==="featured_opportunity").length;

  const resolveRow = (row: EntitlementRow) => {
    const product=productsById.get(row.product_id);
    const payment=row.payment_id?paymentsById.get(row.payment_id):null;
    const talent=row.target_type==="talent"&&row.target_id?talentsById.get(Number(row.target_id)):null;
    const opportunity=row.target_type==="opportunity"&&row.target_id?opportunitiesById.get(Number(row.target_id)):null;
    const active=isActive(row);
    const days=remainingDays(row.expires_at);
    const productName=isArabic?(product?.name_ar||product?.name_en||row.entitlement_code):(product?.name_en||product?.name_ar||row.entitlement_code);
    const talentName=talent?(isArabic?(talent.name_ar||talent.name_en||`#${talent.id}`):(talent.name_en||talent.name_ar||`#${talent.id}`)):null;
    const targetName=talentName||opportunity?.title||row.target_type||"account";
    const targetHref=talentName&&row.target_id?`/admin/talents/${row.target_id}?lang=${locale}`:opportunity&&row.target_id?`/admin/opportunities/${row.target_id}?lang=${locale}`:null;
    return {productName,payment,active,days,targetName,targetHref};
  };

  return (
    <main dir={isArabic?"rtl":"ltr"} className="mx-auto max-w-7xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10">
      <section className="mb-7 sm:mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH ADMIN</p>
        <h1 className="mt-3 text-3xl font-light tracking-tight md:text-5xl">{isArabic?"الاشتراكات والمزايا":"Subscriptions & Benefits"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">{isArabic?"لوحة مالية وتشغيلية للإيرادات التجارية والمزايا المدفوعة، مع استبعاد عمليات الاختبار تلقائيًا.":"Financial and operational view of commercial revenue and paid benefits, automatically excluding test payments."}</p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href={`/admin/payments?lang=${locale}`} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold">{isArabic?"سجل عمليات الدفع":"Payment log"}</Link></div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Metric icon={<WalletCards className="h-4 w-4"/>} label={isArabic?"إجمالي الإيرادات التجارية":"Commercial revenue"} value={money(revenueMinor,"SAR",locale)}/>
        <Metric icon={<TrendingUp className="h-4 w-4"/>} label={isArabic?"إيراد هذا الشهر":"Revenue this month"} value={money(monthRevenueMinor,"SAR",locale)}/>
        <Metric icon={<Sparkles className="h-4 w-4"/>} label={isArabic?"المزايا النشطة":"Active benefits"} value={String(activeCount)}/>
        <Metric icon={<CalendarDays className="h-4 w-4"/>} label={isArabic?"تنتهي خلال 7 أيام":"Expiring in 7 days"} value={String(expiringSoon)}/>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4">
        <RevenueCard title={isArabic?"موهبة مميزة":"Featured Talent"} amount={money(featuredTalentRevenue,"SAR",locale)} subtitle={isArabic?`${activeFeaturedTalents} اشتراك نشط`:`${activeFeaturedTalents} active`}/>
        <RevenueCard title={isArabic?"فرصة مميزة":"Featured Opportunity"} amount={money(featuredOpportunityRevenue,"SAR",locale)} subtitle={isArabic?`${activeFeaturedOpportunities} اشتراك نشط`:`${activeFeaturedOpportunities} active`}/>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
        <Stat label={isArabic?"إجمالي المزايا":"Total benefits"} value={rows.length}/>
        <Stat label={isArabic?"نشطة":"Active"} value={activeCount}/>
        <Stat label={isArabic?"غير نشطة":"Inactive"} value={expiredCount}/>
      </section>

      <section className="mt-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:mt-8 sm:rounded-[2rem]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5"><h2 className="text-base font-medium sm:text-lg">{isArabic?"آخر 100 استحقاق":"Latest 100 entitlements"}</h2></div>
        {rows.length===0?(
          <div className="p-10 text-center text-sm text-white/40">{isArabic?"لا توجد مزايا مدفوعة حتى الآن.":"No paid benefits yet."}</div>
        ):(
          <>
            <div className="divide-y divide-white/[0.07] md:hidden">
              {rows.map(row=>{
                const resolved=resolveRow(row);
                return (
                  <article key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {resolved.targetHref?(
                          <Link href={resolved.targetHref} className="block truncate text-sm text-white/80">{resolved.targetName}</Link>
                        ):(
                          <p className="truncate text-sm text-white/70">{resolved.targetName}</p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gold"><Sparkles className="h-3.5 w-3.5"/><span className="truncate">{resolved.productName}</span></div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] ${resolved.active?"border-emerald-400/25 bg-emerald-400/10 text-emerald-300":"border-white/10 bg-white/[0.04] text-white/45"}`}>
                        {resolved.active?(isArabic?"نشط":"Active"):(isArabic?"غير نشط":"Inactive")}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                      <Info label={isArabic?"البدء":"Starts"} value={formatDate(row.starts_at,locale)}/>
                      <Info label={isArabic?"الانتهاء":"Expires"} value={formatDate(row.expires_at,locale)}/>
                      <Info label={isArabic?"المتبقي":"Remaining"} value={resolved.days==null?"—":resolved.active?(isArabic?`${resolved.days} يوم`:`${resolved.days} days`):(isArabic?"انتهت":"Expired")}/>
                      <Info label={isArabic?"الدفع":"Payment"} value={resolved.payment?money(resolved.payment.amount_minor,resolved.payment.currency,locale):"—"} strong={Boolean(resolved.payment)}/>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                      <p className="min-w-0 truncate font-mono text-[10px] text-white/25" title={row.user_id}>{row.user_id}</p>
                      <AdminEntitlementActions
                        entitlementId={row.id}
                        locale={locale}
                        compact
                        mode={resolved.active?"revoke":"reactivate"}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-black/25 text-[10px] uppercase tracking-[0.16em] text-white/35">
                  <tr>
                    <th className="px-5 py-4 text-start">{isArabic?"المستخدم / الهدف":"User / target"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"الميزة":"Benefit"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"الحالة":"Status"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"البدء":"Starts"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"الانتهاء":"Expires"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"المتبقي":"Remaining"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"الدفع":"Payment"}</th>
                    <th className="px-5 py-4 text-start">{isArabic?"الإجراء":"Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {rows.map(row=>{
                    const resolved=resolveRow(row);
                    return (
                      <tr key={row.id} className="align-top hover:bg-white/[0.025]">
                        <td className="px-5 py-5">
                          <div className="flex items-start gap-2"><UserRound className="mt-0.5 h-4 w-4 text-white/30"/><div>
                            {resolved.targetHref?<Link href={resolved.targetHref} className="text-white/75 transition hover:text-gold">{resolved.targetName}</Link>:<p className="text-white/65">{resolved.targetName}</p>}
                            <p className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-white/30" title={row.user_id}>{row.user_id}</p>
                          </div></div>
                        </td>
                        <td className="px-5 py-5"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold"/><span className="text-white/75">{resolved.productName}</span></div><p className="mt-1 text-[10px] text-white/30">{row.entitlement_code}</p></td>
                        <td className="px-5 py-5"><span className={`inline-flex rounded-full border px-3 py-1 text-[10px] ${resolved.active?"border-emerald-400/25 bg-emerald-400/10 text-emerald-300":"border-white/10 bg-white/[0.04] text-white/45"}`}>{resolved.active?(isArabic?"نشط":"Active"):(isArabic?"غير نشط":"Inactive")}</span></td>
                        <td className="whitespace-nowrap px-5 py-5 text-xs text-white/50">{formatDate(row.starts_at,locale)}</td>
                        <td className="whitespace-nowrap px-5 py-5 text-xs text-white/50">{formatDate(row.expires_at,locale)}</td>
                        <td className="whitespace-nowrap px-5 py-5 text-xs text-white/60">{resolved.days==null?"—":resolved.active?(isArabic?`${resolved.days} يوم`:`${resolved.days} day${resolved.days===1?"":"s"}`):(isArabic?"انتهت":"Expired")}</td>
                        <td className="px-5 py-5">{resolved.payment?<div className="flex items-start gap-2"><CreditCard className="mt-0.5 h-4 w-4 text-white/30"/><div><p className="text-xs text-white/70">{money(resolved.payment.amount_minor,resolved.payment.currency,locale)}</p><p className="mt-1 text-[10px] text-white/30">#{resolved.payment.id} · {resolved.payment.status}</p></div></div>:<span className="text-xs text-white/30">—</span>}</td>
                        <td className="whitespace-nowrap px-5 py-5">
                          <AdminEntitlementActions
                            entitlementId={row.id}
                            locale={locale}
                            compact
                            mode={resolved.active?"revoke":"reactivate"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){
  return <div className="rounded-2xl border border-gold/15 bg-gold/[0.035] p-4 sm:rounded-3xl sm:p-5"><div className="flex items-center gap-1.5 text-[9px] leading-4 text-white/40 sm:gap-2 sm:text-[10px]">{icon}{label}</div><p className="mt-2 text-xl font-light text-white sm:mt-3 sm:text-3xl">{value}</p></div>;
}
function RevenueCard({title,amount,subtitle}:{title:string;amount:string;subtitle:string}){
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5"><p className="text-xs text-white/65 sm:text-sm">{title}</p><p className="mt-2 text-xl font-light text-gold sm:text-2xl">{amount}</p><p className="mt-1.5 text-[10px] text-white/30 sm:mt-2 sm:text-xs">{subtitle}</p></div>;
}
function Stat({label,value}:{label:string;value:number}){
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:rounded-3xl sm:p-5"><div className="flex items-center gap-1 text-[8px] leading-3 text-white/35 sm:gap-2 sm:text-[10px]"><CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5"/>{label}</div><p className="mt-2 text-2xl font-light text-white sm:mt-3 sm:text-3xl">{value}</p></div>;
}
function Info({label,value,strong=false}:{label:string;value:string;strong?:boolean}){
  return <div className="min-w-0"><p className="text-[9px] text-white/30">{label}</p><p className={`mt-1 truncate text-xs ${strong?"text-gold":"text-white/65"}`}>{value}</p></div>;
}
