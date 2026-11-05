"use server";
import { createSupportTicketAction } from "@/lib/actions/create-support-ticket";
export async function createAIProductionRequestAction(formData:FormData){
 const fields=["type","duration","style","format","budget","deadline","references"];
 const labels=["Project type","Duration","Style","Format","Budget","Deadline","Reference links"];
 const brief=String(formData.get("message")||"").trim();
 const details=fields.map((key,index)=>`${labels[index]}: ${String(formData.get(key)||"Not specified").slice(0,2000)}`).join("\n");
 formData.set("message",`MLAMH AI production request\n${details}\n\nBrief:\n${brief}`);
 formData.set("subject","MLAMH AI production request");
 formData.set("category","partnership");
 return createSupportTicketAction(formData);
}