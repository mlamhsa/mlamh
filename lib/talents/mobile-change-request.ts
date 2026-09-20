import { normalizeNationalitySlug } from "@/lib/data/nationality-normalization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getMobileTalentChangeRequest(userId: string) {
  const admin=createAdminClient();
  const [{data:profile,error:profileError},{data:talent,error:talentError}]=await Promise.all([
    admin.from("profiles").select("account_type,approval_status,phone").eq("user_id",userId).maybeSingle(),
    admin.from("talents").select("id,name_ar,name_en,nationality_slug,nationality").eq("user_id",userId).maybeSingle(),
  ]);
  if(profileError||talentError)return {ok:false as const,code:"LOOKUP_FAILED" as const};
  if(!profile||profile.account_type!=="talent"||!talent)return {ok:false as const,code:"TALENT_NOT_FOUND" as const};
  const {data:pending,error:pendingError}=await admin.from("talent_profile_change_requests").select("id,requested_name_ar,requested_name_en,requested_phone,requested_nationality_slug,status,created_at").eq("talent_id",talent.id).eq("status","pending").maybeSingle();
  if(pendingError)return {ok:false as const,code:"LOOKUP_FAILED" as const};
  return {ok:true as const,item:{approved:String(profile.approval_status??"").trim().toLowerCase()==="approved",name:String(talent.name_ar||talent.name_en||"").trim(),phone:String(profile.phone||"").trim(),nationalitySlug:normalizeNationalitySlug(String(talent.nationality_slug??talent.nationality??"").trim())||null,pending:pending?{id:Number(pending.id),name:String(pending.requested_name_ar||pending.requested_name_en||"").trim()||null,phone:pending.requested_phone??null,nationalitySlug:pending.requested_nationality_slug??null,createdAt:pending.created_at??null}:null}};
}

export async function createMobileTalentChangeRequest(userId:string,input:Record<string,unknown>){
  const admin=createAdminClient();
  const [{data:profile,error:profileError},{data:talent,error:talentError}]=await Promise.all([
    admin.from("profiles").select("account_type,approval_status,phone").eq("user_id",userId).maybeSingle(),
    admin.from("talents").select("id,name_ar,name_en,nationality_slug,nationality").eq("user_id",userId).maybeSingle(),
  ]);
  if(profileError||talentError)return {ok:false as const,code:"LOOKUP_FAILED" as const};
  if(!profile||profile.account_type!=="talent"||!talent)return {ok:false as const,code:"TALENT_NOT_FOUND" as const};
  if(String(profile.approval_status??"").trim().toLowerCase()!=="approved")return {ok:false as const,code:"NOT_APPROVED" as const};
  const {data:existing,error:existingError}=await admin.from("talent_profile_change_requests").select("id").eq("talent_id",talent.id).eq("status","pending").maybeSingle();
  if(existingError)return {ok:false as const,code:"LOOKUP_FAILED" as const}; if(existing)return {ok:false as const,code:"REQUEST_PENDING" as const};
  const name=typeof input.name==="string"?input.name.trim():""; const phone=typeof input.phone==="string"?input.phone.trim():""; const rawNationality=typeof input.nationalitySlug==="string"?input.nationalitySlug.trim():""; const nationality=normalizeNationalitySlug(rawNationality);
  if(rawNationality&&!nationality)return {ok:false as const,code:"INVALID_NATIONALITY" as const};
  const currentNameAr=String(talent.name_ar??"").trim(), currentNameEn=String(talent.name_en??"").trim(), currentPhone=String(profile.phone??"").trim(), currentNationality=normalizeNationalitySlug(String(talent.nationality_slug??talent.nationality??"").trim());
  const nameChanged=Boolean(name)&&name!==currentNameAr&&name!==currentNameEn; const phoneChanged=Boolean(phone)&&phone!==currentPhone; const nationalityChanged=Boolean(nationality)&&nationality!==currentNationality;
  if(!nameChanged&&!phoneChanged&&!nationalityChanged)return {ok:false as const,code:"NO_CHANGES" as const};
  const {error}=await admin.from("talent_profile_change_requests").insert({user_id:userId,talent_id:talent.id,requested_name_ar:nameChanged?name:null,requested_name_en:nameChanged?name:null,requested_phone:phoneChanged?phone:null,requested_nationality_slug:nationalityChanged?nationality:null,status:"pending"});
  if(error)return {ok:false as const,code:"INSERT_FAILED" as const}; return {ok:true as const};
}