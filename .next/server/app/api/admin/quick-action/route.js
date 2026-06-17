"use strict";(()=>{var e={};e.id=2591,e.ids=[2591],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2081:e=>{e.exports=require("child_process")},6113:e=>{e.exports=require("crypto")},9523:e=>{e.exports=require("dns")},2361:e=>{e.exports=require("events")},7147:e=>{e.exports=require("fs")},3685:e=>{e.exports=require("http")},5687:e=>{e.exports=require("https")},1808:e=>{e.exports=require("net")},2037:e=>{e.exports=require("os")},1017:e=>{e.exports=require("path")},2781:e=>{e.exports=require("stream")},4404:e=>{e.exports=require("tls")},7310:e=>{e.exports=require("url")},3837:e=>{e.exports=require("util")},9796:e=>{e.exports=require("zlib")},3187:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>v,patchFetch:()=>q,requestAsyncStorage:()=>b,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>f});var a={};t.r(a),t.d(a,{GET:()=>m});var i=t(9303),n=t(8716),o=t(670),s=t(7070),p=t(5748),d=t(4097),u=t(471);let l=process.env.NEXTAUTH_URL??"http://localhost:4001",c=process.env.ADMIN_EMAIL??"";async function m(e){let r=e.nextUrl.searchParams.get("token")??"",t=(0,d.m)(r);if(!t)return x("❌ Invalid or expired link","This approve/deny link has expired or is invalid. Please use the admin panel.","#991b1b",l+"/admin/users");let{userId:a,action:i}=t,n=await p._.user.findUnique({where:{id:a}}).catch(()=>null);return n?"approved"===n.status&&"approve"===i?x("✅ Already approved",`${n.name} was already approved. No change made.`,"#166534",l+"/admin/users"):"denied"===n.status&&"deny"===i?x("Already denied",`${n.name} was already denied. No change made.`,"#374151",l+"/admin/users"):(await p._.user.update({where:{id:a},data:{status:"approve"===i?"approved":"denied"}}),"approve"===i)?(await (0,u.Cz)(n.email,"\uD83C\uDF89 You're approved — FIFAFun 2026!",(0,u.ov)(n.name,l+"/auth/login")).catch(()=>{}),x("✅ Approved!",`${n.name} (${n.email}) has been approved and notified by email.`,"#166534",l+"/admin/users")):(await (0,u.Cz)(n.email,"FIFAFun account update",(0,u.a6)(n.name,c)).catch(()=>{}),x("Denied",`${n.name} (${n.email}) has been denied and notified by email.`,"#374151",l+"/admin/users")):x("❌ User not found","The player account no longer exists.","#991b1b",l+"/admin/users")}function x(e,r,t,a){let i=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${e} — FIFAFun</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f4f6fb; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .icon { font-size: 52px; margin-bottom: 16px; }
  h1 { font-size: 22px; font-weight: 900; color: ${t}; margin-bottom: 12px; }
  p { color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
  a.btn { display: inline-block; background: #1e3a5f; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  a.btn:hover { background: #0d1b3e; }
  .brand { margin-top: 32px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">⚽</div>
    <h1>${e}</h1>
    <p>${r}</p>
    <a href="${a}" class="btn">Open admin panel</a>
    <p class="brand">FIFA<strong style="color:#f59e0b">Fun</strong> 2026 \xb7 Admin Panel</p>
  </div>
</body>
</html>`;return new s.NextResponse(i,{headers:{"Content-Type":"text/html"}})}let h=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/quick-action/route",pathname:"/api/admin/quick-action",filename:"route",bundlePath:"app/api/admin/quick-action/route"},resolvedPagePath:"D:\\DevApp\\WorldCup2026-App\\src\\app\\api\\admin\\quick-action\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:b,staticGenerationAsyncStorage:f,serverHooks:g}=h,v="/api/admin/quick-action/route";function q(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:f})}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),a=r.X(0,[8948,5972,5245,4158],()=>t(3187));module.exports=a})();