"use strict";exports.id=4158,exports.ids=[4158],exports.modules={9925:e=>{var t=Object.defineProperty,r=Object.getOwnPropertyDescriptor,n=Object.getOwnPropertyNames,i=Object.prototype.hasOwnProperty,o={};function a(e){var t;let r=["path"in e&&e.path&&`Path=${e.path}`,"expires"in e&&(e.expires||0===e.expires)&&`Expires=${("number"==typeof e.expires?new Date(e.expires):e.expires).toUTCString()}`,"maxAge"in e&&"number"==typeof e.maxAge&&`Max-Age=${e.maxAge}`,"domain"in e&&e.domain&&`Domain=${e.domain}`,"secure"in e&&e.secure&&"Secure","httpOnly"in e&&e.httpOnly&&"HttpOnly","sameSite"in e&&e.sameSite&&`SameSite=${e.sameSite}`,"partitioned"in e&&e.partitioned&&"Partitioned","priority"in e&&e.priority&&`Priority=${e.priority}`].filter(Boolean),n=`${e.name}=${encodeURIComponent(null!=(t=e.value)?t:"")}`;return 0===r.length?n:`${n}; ${r.join("; ")}`}function s(e){let t=new Map;for(let r of e.split(/; */)){if(!r)continue;let e=r.indexOf("=");if(-1===e){t.set(r,"true");continue}let[n,i]=[r.slice(0,e),r.slice(e+1)];try{t.set(n,decodeURIComponent(null!=i?i:"true"))}catch{}}return t}function l(e){var t,r;if(!e)return;let[[n,i],...o]=s(e),{domain:a,expires:l,httponly:f,maxage:u,path:c,samesite:g,secure:h,partitioned:m,priority:x}=Object.fromEntries(o.map(([e,t])=>[e.toLowerCase(),t]));return function(e){let t={};for(let r in e)e[r]&&(t[r]=e[r]);return t}({name:n,value:decodeURIComponent(i),domain:a,...l&&{expires:new Date(l)},...f&&{httpOnly:!0},..."string"==typeof u&&{maxAge:Number(u)},path:c,...g&&{sameSite:p.includes(t=(t=g).toLowerCase())?t:void 0},...h&&{secure:!0},...x&&{priority:d.includes(r=(r=x).toLowerCase())?r:void 0},...m&&{partitioned:!0}})}((e,r)=>{for(var n in r)t(e,n,{get:r[n],enumerable:!0})})(o,{RequestCookies:()=>f,ResponseCookies:()=>u,parseCookie:()=>s,parseSetCookie:()=>l,stringifyCookie:()=>a}),e.exports=((e,o,a,s)=>{if(o&&"object"==typeof o||"function"==typeof o)for(let a of n(o))i.call(e,a)||void 0===a||t(e,a,{get:()=>o[a],enumerable:!(s=r(o,a))||s.enumerable});return e})(t({},"__esModule",{value:!0}),o);var p=["strict","lax","none"],d=["low","medium","high"],f=class{constructor(e){this._parsed=new Map,this._headers=e;let t=e.get("cookie");if(t)for(let[e,r]of s(t))this._parsed.set(e,{name:e,value:r})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed);if(!e.length)return r.map(([e,t])=>t);let n="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(([e])=>e===n).map(([e,t])=>t)}has(e){return this._parsed.has(e)}set(...e){let[t,r]=1===e.length?[e[0].name,e[0].value]:e,n=this._parsed;return n.set(t,{name:t,value:r}),this._headers.set("cookie",Array.from(n).map(([e,t])=>a(t)).join("; ")),this}delete(e){let t=this._parsed,r=Array.isArray(e)?e.map(e=>t.delete(e)):t.delete(e);return this._headers.set("cookie",Array.from(t).map(([e,t])=>a(t)).join("; ")),r}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(e=>`${e.name}=${encodeURIComponent(e.value)}`).join("; ")}},u=class{constructor(e){var t,r,n;this._parsed=new Map,this._headers=e;let i=null!=(n=null!=(r=null==(t=e.getSetCookie)?void 0:t.call(e))?r:e.get("set-cookie"))?n:[];for(let e of Array.isArray(i)?i:function(e){if(!e)return[];var t,r,n,i,o,a=[],s=0;function l(){for(;s<e.length&&/\s/.test(e.charAt(s));)s+=1;return s<e.length}for(;s<e.length;){for(t=s,o=!1;l();)if(","===(r=e.charAt(s))){for(n=s,s+=1,l(),i=s;s<e.length&&"="!==(r=e.charAt(s))&&";"!==r&&","!==r;)s+=1;s<e.length&&"="===e.charAt(s)?(o=!0,s=i,a.push(e.substring(t,n)),t=s):s=n+1}else s+=1;(!o||s>=e.length)&&a.push(e.substring(t,e.length))}return a}(i)){let t=l(e);t&&this._parsed.set(t.name,t)}}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed.values());if(!e.length)return r;let n="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(e=>e.name===n)}has(e){return this._parsed.has(e)}set(...e){let[t,r,n]=1===e.length?[e[0].name,e[0].value,e[0]]:e,i=this._parsed;return i.set(t,function(e={name:"",value:""}){return"number"==typeof e.expires&&(e.expires=new Date(e.expires)),e.maxAge&&(e.expires=new Date(Date.now()+1e3*e.maxAge)),(null===e.path||void 0===e.path)&&(e.path="/"),e}({name:t,value:r,...n})),function(e,t){for(let[,r]of(t.delete("set-cookie"),e)){let e=a(r);t.append("set-cookie",e)}}(i,this._headers),this}delete(...e){let[t,r,n]="string"==typeof e[0]?[e[0]]:[e[0].name,e[0].path,e[0].domain];return this.set({name:t,path:r,domain:n,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(a).join("; ")}}},2044:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{RequestCookies:function(){return n.RequestCookies},ResponseCookies:function(){return n.ResponseCookies}});let n=r(9925)},4097:(e,t,r)=>{r.d(t,{Q:()=>a,m:()=>s});var n=r(6113),i=r.n(n);function o(){let e=process.env.NEXTAUTH_SECRET;if(!e)throw Error("NEXTAUTH_SECRET is not set");return e}function a(e,t){let r=`${e}:${t}:${Date.now()}`,n=Buffer.from(r).toString("base64url"),a=i().createHmac("sha256",o()).update(n).digest("hex");return`${n}.${a}`}function s(e){try{let t=e.lastIndexOf(".");if(-1===t)return null;let r=e.slice(0,t),n=e.slice(t+1),a=i().createHmac("sha256",o()).update(r).digest("hex");if(!i().timingSafeEqual(Buffer.from(n,"hex"),Buffer.from(a,"hex")))return null;let s=Buffer.from(r,"base64url").toString().split(":");if(3!==s.length)return null;let[l,p,d]=s,f=parseInt(d,10);if(isNaN(f)||Date.now()-f>6048e5||"approve"!==p&&"deny"!==p)return null;return{userId:l,action:p,issuedAt:f}}catch{return null}}},5748:(e,t,r)=>{r.d(t,{_:()=>i});var n=r(3524);let i=globalThis.prisma??new n.PrismaClient({log:[]})},471:(e,t,r)=>{r.d(t,{Cz:()=>o,GO:()=>i,Mi:()=>l,a6:()=>f,ov:()=>d,pU:()=>p});var n=r(5245);function i(){let e=process.env.EMAIL_SERVER_HOST??"",t=process.env.EMAIL_SERVER_PASSWORD??"";return e.length>0&&"P@ss"!==t&&t.length>0}async function o(e,t,r){if(!i()){console.log("[email] SMTP not configured — skipping send to",e,"|",t);return}await n.createTransport({host:process.env.EMAIL_SERVER_HOST,port:Number(process.env.EMAIL_SERVER_PORT??587),secure:465===Number(process.env.EMAIL_SERVER_PORT),auth:{user:process.env.EMAIL_SERVER_USER,pass:process.env.EMAIL_SERVER_PASSWORD}}).sendMail({from:process.env.EMAIL_FROM,to:e,subject:t,html:r})}function a(e){return`<!DOCTYPE html>
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
  </p>`}function l(e,t){return a(`
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
  `)}function p(e,t,r,n,i,o,s,l,p){return a(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">⏳ New player waiting for approval</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px">
      A player verified their email and is waiting for your approval.
    </p>

    <!-- Player details card -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px">
      <tr>
        <td style="padding:18px 22px">
          ${c("Full name",e)}
          ${c("Email",t)}
          ${c("Username",r||"—")}
          ${c("Nickname",n||"—")}
          ${c("League",i||"—")}
          ${o?c("Cheering for",o):""}
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
          <a href="${l}"
            style="display:block;text-align:center;background:#991b1b;color:#ffffff;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            ❌ Deny
          </a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;margin:20px 0 0;color:#9ca3af;font-size:12px">
      Or <a href="${p}" style="color:#1e3a5f">open the admin panel</a> to manage all players.
      These one-click links expire in 7 days.
    </p>
  `)}function d(e,t){return a(`
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
  `)}function f(e,t){return a(`
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
  `)}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function c(e,t){return`<p style="margin:0 0 8px;font-size:13px;color:#374151">
    <span style="color:#6b7280;min-width:110px;display:inline-block">${e}:</span>
    <strong style="color:#111827">${u(t)}</strong>
  </p>`}}};