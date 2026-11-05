"use client";
import { useEffect } from "react";
export function AIProductionSuccessScroll(){
 useEffect(()=>{
  const el=document.getElementById("request-confirmation");
  if(!el)return;
  const raf=requestAnimationFrame(()=>{
   el.scrollIntoView({behavior:"instant",block:"center"});
   el.focus({preventScroll:true});
  });
  return ()=>cancelAnimationFrame(raf);
 },[]);
 return null;
}
