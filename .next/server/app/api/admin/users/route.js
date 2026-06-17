"use strict";(()=>{var e={};e.id=2628,e.ids=[2628],e.modules={3524:e=>{e.exports=require("@prisma/client")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2081:e=>{e.exports=require("child_process")},6113:e=>{e.exports=require("crypto")},9523:e=>{e.exports=require("dns")},2361:e=>{e.exports=require("events")},7147:e=>{e.exports=require("fs")},3685:e=>{e.exports=require("http")},5687:e=>{e.exports=require("https")},1808:e=>{e.exports=require("net")},2037:e=>{e.exports=require("os")},1017:e=>{e.exports=require("path")},2781:e=>{e.exports=require("stream")},4404:e=>{e.exports=require("tls")},7310:e=>{e.exports=require("url")},3837:e=>{e.exports=require("util")},9796:e=>{e.exports=require("zlib")},5952:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>b,patchFetch:()=>w,requestAsyncStorage:()=>h,routeModule:()=>x,serverHooks:()=>m,staticGenerationAsyncStorage:()=>y});var n={};r.r(n),r.d(n,{GET:()=>f,PATCH:()=>g});var a=r(9303),i=r(8716),o=r(670),s=r(7070),p=r(5748),l=r(5456),d=r(471);let c=process.env.NEXTAUTH_URL??"http://localhost:4001",u=process.env.ADMIN_EMAIL??"";async function f(){await (0,l.kF)();let e=await p._.user.findMany({orderBy:{createdAt:"desc"},select:{id:!0,name:!0,email:!0,username:!0,nickname:!0,league:!0,cheeringFrom:!0,status:!0,role:!0,createdAt:!0}});return s.NextResponse.json(e)}async function g(e){await (0,l.kF)();let t=await e.json(),{userId:r,action:n}=t;if("resend_verify"===n){let e=(0,l.RA)(),t=new Date(Date.now()+864e5),n=await p._.user.update({where:{id:r},data:{verifyToken:e,verifyExpiry:t,status:"pending"}}),a=c+"/auth/verify?token="+e;return(0,d.GO)()?(await (0,d.Cz)(n.email,"⚽ Verify your FIFAFun 2026 email",(0,d.Mi)(n.name,a)).catch(()=>{}),s.NextResponse.json({ok:!0,sent:!0,verifyUrl:a})):s.NextResponse.json({ok:!0,sent:!1,verifyUrl:a})}if("force_approve"===n){let e=await p._.user.update({where:{id:r},data:{status:"approved",verifyToken:null,verifyExpiry:null}});return await (0,d.Cz)(e.email,"\uD83C\uDF89 You're approved — FIFAFun 2026!",(0,d.ov)(e.name,c+"/auth/login")).catch(()=>{}),s.NextResponse.json({ok:!0})}let a={};switch(n){case"approve":a={status:"approved"};break;case"deny":a={status:"denied"};break;case"make_admin":a={role:"admin"};break;case"make_player":a={role:"player"};break;case"set_league":a={league:t.league??""};break;default:return s.NextResponse.json({error:"Unknown action"},{status:400})}let i=await p._.user.update({where:{id:r},data:a});return"approve"===n&&await (0,d.Cz)(i.email,"\uD83C\uDF89 You're approved — FIFAFun 2026!",(0,d.ov)(i.name,c+"/auth/login")).catch(()=>{}),"deny"===n&&await (0,d.Cz)(i.email,"FIFAFun account update",(0,d.a6)(i.name,u)).catch(()=>{}),s.NextResponse.json({ok:!0})}let x=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/admin/users/route",pathname:"/api/admin/users",filename:"route",bundlePath:"app/api/admin/users/route"},resolvedPagePath:"D:\\DevApp\\WorldCup2026-App\\src\\app\\api\\admin\\users\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:h,staticGenerationAsyncStorage:y,serverHooks:m}=x,b="/api/admin/users/route";function w(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:y})}},5456:(e,t,r)=>{r.d(t,{Gg:()=>f,Gv:()=>d,RA:()=>c,SO:()=>g,c_:()=>l,ed:()=>u,kF:()=>h});var n=r(1615),a=r(5748),i=r(2023),o=r.n(i),s=r(6113),p=r.n(s);async function l(e){return o().hash(e,12)}async function d(e,t){return o().compare(e,t)}function c(e=32){return p().randomBytes(e).toString("hex")}async function u(e){let t=c(),r=new Date(Date.now()+2592e6);return await a._.session.create({data:{userId:e,token:t,expiresAt:r}}),t}async function f(){let e=(0,n.cookies)(),t=e.get("session")?.value;if(!t)return null;let r=await a._.session.findUnique({where:{token:t},include:{user:!0}});return!r||r.expiresAt<new Date?null:r.user}async function g(e){await a._.session.deleteMany({where:{token:e}}).catch(()=>{})}async function x(){let e=await f();if(!e)throw Error("UNAUTHORIZED");return e}async function h(){let e=await x();if("admin"!==e.role)throw Error("FORBIDDEN");return e}},5748:(e,t,r)=>{r.d(t,{_:()=>a});var n=r(3524);let a=globalThis.prisma??new n.PrismaClient({log:[]})},471:(e,t,r)=>{r.d(t,{Cz:()=>i,GO:()=>a,Mi:()=>p,a6:()=>c,ov:()=>d,pU:()=>l});var n=r(5245);function a(){let e=process.env.EMAIL_SERVER_HOST??"",t=process.env.EMAIL_SERVER_PASSWORD??"";return e.length>0&&"P@ss"!==t&&t.length>0}async function i(e,t,r){if(!a()){console.log("[email] SMTP not configured — skipping send to",e,"|",t);return}await n.createTransport({host:process.env.EMAIL_SERVER_HOST,port:Number(process.env.EMAIL_SERVER_PORT??587),secure:465===Number(process.env.EMAIL_SERVER_PORT),auth:{user:process.env.EMAIL_SERVER_USER,pass:process.env.EMAIL_SERVER_PASSWORD}}).sendMail({from:process.env.EMAIL_FROM,to:e,subject:t,html:r})}function o(e){return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>FIFAFun 2026</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0d1b3e,#1e3a5f);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
      <span style="font-size:28px">⚽</span>
      <h1 style="margin:8px 0 4px;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px">
        FIFA<span style="color:#f59e0b">Fun</span> 2026
      </h1>
      <p style="margin:0;color:#93c5fd;font-size:12px;letter-spacing:1px">WORLD CUP PREDICTION POOL</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px">
      ${e}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:20px 32px;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:11px">
        WorldCup FIFAFun 2026 \xb7 Free fun pool \xb7 No real prizes
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`}function s(e,t,r="#1e3a5f"){return`<p style="text-align:center;margin:28px 0">
    <a href="${e}"
       style="display:inline-block;background:${r};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">
      ${t}
    </a>
  </p>`}function p(e,t){return o(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">Hi ${u(e)}, one quick step!</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Thanks for joining FIFAFun! Click below to verify your email address.
      After that, an admin will review and approve your account — then you're in!
    </p>
    ${s(t,"✅ Verify my email","#1e3a5f")}
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin-top:8px">
      <p style="margin:0;color:#92400e;font-size:12px;line-height:1.6">
        ⏰ This link expires in <strong>24 hours</strong>.
        If you didn't register for FIFAFun, you can safely ignore this email.
      </p>
    </div>
  `)}function l(e,t,r,n,a,i,s,p,l){return o(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">⏳ New player waiting for approval</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px">
      A player verified their email and is waiting for your approval.
    </p>

    <!-- Player details card -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px">
      <tr>
        <td style="padding:18px 22px">
          ${f("Full name",e)}
          ${f("Email",t)}
          ${f("Username",r||"—")}
          ${f("Nickname",n||"—")}
          ${f("League",a||"—")}
          ${i?f("Cheering for",i):""}
        </td>
      </tr>
    </table>

    <!-- Action buttons -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="padding-right:8px">
          <a href="${s}"
            style="display:block;text-align:center;background:#166534;color:#ffffff;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            ✅ Approve
          </a>
        </td>
        <td width="48%" style="padding-left:8px">
          <a href="${p}"
            style="display:block;text-align:center;background:#991b1b;color:#ffffff;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            ❌ Deny
          </a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;margin:20px 0 0;color:#9ca3af;font-size:12px">
      Or <a href="${l}" style="color:#1e3a5f">open the admin panel</a> to manage all players.
      These one-click links expire in 7 days.
    </p>
  `)}function d(e,t){return o(`
    <h2 style="margin:0 0 6px;color:#166534;font-size:22px;font-weight:900">🎉 You're approved!</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Hi <strong>${u(e)}</strong> — great news! Your FIFAFun account has been approved.
      Log in now and start predicting World Cup 2026 matches for bragging rights!
    </p>
    ${s(t,"⚽ Log in and play","#166534")}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-top:8px">
      <p style="margin:0;color:#14532d;font-size:12px;line-height:1.6">
        🏆 Predict match scores, use your Joker wisely, and answer bonus questions to climb the leaderboard.
        May the best predictor win!
      </p>
    </div>
  `)}function c(e,t){return o(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">FIFAFun account update</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Hi <strong>${u(e)}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Unfortunately we were unable to approve your FIFAFun account at this time.
      This pool is intended for friends and family of the organizers.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6">
      If you think this is a mistake, please reach out to the admin at
      <a href="mailto:${t}" style="color:#1e3a5f">${t}</a>.
    </p>
  `)}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function f(e,t){return`<p style="margin:0 0 8px;font-size:13px;color:#374151">
    <span style="color:#6b7280;min-width:110px;display:inline-block">${e}:</span>
    <strong style="color:#111827">${u(t)}</strong>
  </p>`}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[8948,4028,5972,5245],()=>r(5952));module.exports=n})();