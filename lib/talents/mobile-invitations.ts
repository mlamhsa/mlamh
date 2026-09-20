import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";

type Locale = "ar" | "en";

export async function getMobileTalentInvitations(userId:string, locale:Locale){
  const admin=createAdminClient();
  const {data:talent,error:talentError}=await admin.from("talents").select("id").eq("user_id",userId).maybeSingle();
  if(talentError)return {ok:false as const,code:"LOOKUP_FAILED" as const};
  if(!talent)return {ok:false as const,code:"TALENT_NOT_FOUND" as const};
  const {data:invitations,error}=await admin.from("opportunity_invitations").select("id,publisher_id,opportunity_id,status,created_at").eq("talent_id",talent.id).order("created_at",{ascending:false});
  if(error)return {ok:false as const,code:"LOOKUP_FAILED" as const};
  const rows=invitations??[]; const opportunityIds=[...new Set(rows.map((x)=>Number(x.opportunity_id)))]; const publisherIds=[...new Set(rows.map((x)=>Number(x.publisher_id)))];
  const [{data:opportunities,error:oppError},{data:publishers,error:pubError}]=await Promise.all([
    opportunityIds.length?admin.from("opportunities").select("id,slug,title,title_en,city_ar,city_en,posting_mode").in("id",opportunityIds):Promise.resolve({data:[],error:null}),
    publisherIds.length?admin.from("publishers").select("id,company_name,contact_name,publisher_type,verified").in("id",publisherIds):Promise.resolve({data:[],error:null}),
  ]);
  if(oppError||pubError)return {ok:false as const,code:"LOOKUP_FAILED" as const};
  const oppMap=new Map((opportunities??[]).map((x)=>[Number(x.id),x])); const pubMap=new Map((publishers??[]).map((x)=>[Number(x.id),x]));
  return {ok:true as const,items:rows.map((row)=>{const opp=oppMap.get(Number(row.opportunity_id)); const pub=pubMap.get(Number(row.publisher_id)); return {
    id:Number(row.id),status:String(row.status??"sent"),createdAt:row.created_at??null,
    opportunity:{id:Number(row.opportunity_id),slug:opp?.slug??null,title:locale==="en"?(opp?.title_en||opp?.title||""):(opp?.title||opp?.title_en||""),city:locale==="en"?(opp?.city_en||opp?.city_ar||null):(opp?.city_ar||opp?.city_en||null),postingMode:opp?.posting_mode==="quick"?"quick":"casting"},
    publisher:{id:Number(row.publisher_id),name:pub?.company_name||pub?.contact_name||(locale==="ar"?"ناشر في ملامح":"MLAMH publisher"),verified:Boolean(pub?.verified),type:pub?.publisher_type??null},
  }})};
}

export async function respondMobileTalentInvitation(userId:string, invitationId:number, response:"accepted"|"declined", locale:Locale){
  const admin=createAdminClient();
  const {data:talent,error:talentError}=await admin.from("talents").select("id,name_ar,name_en").eq("user_id",userId).maybeSingle();
  if(talentError)return {ok:false as const,code:"LOOKUP_FAILED" as const}; if(!talent)return {ok:false as const,code:"TALENT_NOT_FOUND" as const};
  const {data:invitation,error:lookupError}=await admin.from("opportunity_invitations").select("id,talent_id,publisher_id,status,opportunity_id").eq("id",invitationId).eq("talent_id",talent.id).maybeSingle();
  if(lookupError)return {ok:false as const,code:"LOOKUP_FAILED" as const}; if(!invitation)return {ok:false as const,code:"INVITATION_NOT_FOUND" as const};
  if(invitation.status!=="sent")return {ok:true as const,status:String(invitation.status)};
  const {error:updateError}=await admin.from("opportunity_invitations").update({status:response}).eq("id",invitation.id).eq("talent_id",talent.id).eq("status","sent");
  if(updateError)return {ok:false as const,code:"UPDATE_FAILED" as const};
  if(response==="declined"){
    const {data:interest}=await admin.from("opportunity_applications").select("id").eq("opportunity_id",invitation.opportunity_id).eq("talent_id",talent.id).maybeSingle();
    if(!interest){const now=new Date().toISOString();await admin.from("conversations").update({status:"closed",closed_at:now,updated_at:now}).eq("opportunity_id",invitation.opportunity_id).eq("publisher_id",invitation.publisher_id).eq("talent_id",talent.id).eq("conversation_type","publisher_talent").eq("status","active")}
  }
  const [oppResult,convResult]=await Promise.all([
    admin.from("opportunities").select("title,slug").eq("id",invitation.opportunity_id).maybeSingle(),
    admin.from("conversations").select("id,status").eq("opportunity_id",invitation.opportunity_id).eq("publisher_id",invitation.publisher_id).eq("talent_id",talent.id).eq("conversation_type","publisher_talent").maybeSingle(),
  ]);
  await createEvent({type:response==="accepted"?EVENT_TYPES.opportunity_invitation_accepted:EVENT_TYPES.opportunity_invitation_declined,target:EVENT_TARGETS.PUBLISHER,targetId:invitation.publisher_id,metadata:{locale,invitationId:invitation.id,opportunityId:invitation.opportunity_id,opportunitySlug:oppResult.data?.slug??null,title:oppResult.data?.title??"",talentId:talent.id,talent_name:locale==="ar"?(talent.name_ar||talent.name_en||""):(talent.name_en||talent.name_ar||""),conversationId:convResult.data?.id??null,conversationStatus:convResult.data?.status??null}});
  return {ok:true as const,status:response,conversationId:convResult.data?.id??null};
}