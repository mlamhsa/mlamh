import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth/request-user";
import { getMobileTalentLinks, updateMobileTalentLinks } from "@/lib/talents/mobile-profile-links";
export async function GET(request: Request) {
  const auth = await getRequestUser(request); if (!auth.ok) return NextResponse.json({ok:false,code:"UNAUTHENTICATED"},{status:401});
  const result=await getMobileTalentLinks(auth.user.id); return NextResponse.json(result,{status:result.ok?200:result.code==="TALENT_NOT_FOUND"?404:500});
}
export async function PATCH(request: Request) {
  const auth=await getRequestUser(request); if(!auth.ok)return NextResponse.json({ok:false,code:"UNAUTHENTICATED"},{status:401});
  let input:unknown; try{input=await request.json()}catch{return NextResponse.json({ok:false,code:"INVALID_BODY"},{status:400})}
  if(!input||typeof input!=="object"||Array.isArray(input))return NextResponse.json({ok:false,code:"INVALID_BODY"},{status:400});
  const result=await updateMobileTalentLinks(auth.user.id,input as Record<string,unknown>);
  return NextResponse.json(result,{status:result.ok?200:result.code==="INVALID_LINK"?400:result.code==="TALENT_NOT_FOUND"?404:500});
}