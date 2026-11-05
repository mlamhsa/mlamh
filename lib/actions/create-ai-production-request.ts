"use server";
import { createSupportTicketAction } from "@/lib/actions/create-support-ticket";
export async function createAIProductionRequestAction(formData:FormData){
 const fields=["type","duration","custom_duration","style","format","budget","deadline","characters_count","scenes_count","audio","script_status","characters_scenes","references"];
 const labels=["Project type","Duration","Exact duration","Style","Format","Budget","Deadline","Characters","Scenes","Audio","Script status","Characters and scenes","Reference links"];
 const brief=String(formData.get("message")||"").trim();
 const details=fields.filter(key=>key!=="custom_duration"||String(formData.get("duration"))==="custom").map((key)=>`${labels[fields.indexOf(key)]}: ${String(formData.get(key)||"Not specified").slice(0,3000)}`).join("\n");
 formData.set("message",`MLAMH AI production request\n${details}\n\nBrief:\n${brief}`);
 formData.set("subject","MLAMH AI production request");
 formData.set("category","partnership");
 formData.set("return_to","ai-production");
 return createSupportTicketAction(formData);
}