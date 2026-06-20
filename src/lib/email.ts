import nodemailer from 'nodemailer'

/* ─── Transport ────────────────────────────────────────────── */
function makeTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_SERVER_HOST,
    port:   Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

/** Returns true when real SMTP credentials are configured */
export function emailEnabled(): boolean {
  const host = process.env.EMAIL_SERVER_HOST ?? ''
  const pass = process.env.EMAIL_SERVER_PASSWORD ?? ''
  return host.length > 0 && pass !== 'P@ss' && pass.length > 0
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!emailEnabled()) {
    console.log('[email] SMTP not configured — skipping send to', to, '|', subject)
    return
  }
  await makeTransport().sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
}

/* ─── Shared layout ────────────────────────────────────────── */
function wrap(body: string) {
  return `<!DOCTYPE html>
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
      ${body}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:20px 32px;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:11px">
        WorldCup FIFAFun 2026 · Free fun pool · No real prizes
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function btn(url: string, label: string, bg = '#1e3a5f') {
  return `<p style="text-align:center;margin:28px 0">
    <a href="${url}"
       style="display:inline-block;background:${bg};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px">
      ${label}
    </a>
  </p>`
}

/* ─── Template 1 — Player: verify email ────────────────────── */
export function verifyEmailHtml(name: string, verifyUrl: string) {
  return wrap(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">Hi ${esc(name)}, one quick step!</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Thanks for joining FIFAFun! Click below to verify your email address.
      After that, an admin will review and approve your account — then you're in!
    </p>
    ${btn(verifyUrl, '✅ Verify my email', '#1e3a5f')}
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin-top:8px">
      <p style="margin:0;color:#92400e;font-size:12px;line-height:1.6">
        ⏰ This link expires in <strong>24 hours</strong>.
        If you didn't register for FIFAFun, you can safely ignore this email.
      </p>
    </div>
  `)
}

/* ─── Template 2 — Admin: new player needs approval ────────── */
export function adminApprovalEmailHtml(
  playerName: string,
  playerEmail: string,
  playerUsername: string,
  playerNickname: string,
  playerLeague: string,
  playerCheering: string,
  approveUrl: string,
  denyUrl: string,
  adminPanelUrl: string,
) {
  return wrap(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">⏳ New player waiting for approval</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px">
      A player verified their email and is waiting for your approval.
    </p>

    <!-- Player details card -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px">
      <tr>
        <td style="padding:18px 22px">
          ${row('Full name',  playerName)}
          ${row('Email',      playerEmail)}
          ${row('Username',   playerUsername || '—')}
          ${row('Nickname',   playerNickname || '—')}
          ${row('League',     playerLeague || '—')}
          ${playerCheering ? row('Cheering for', playerCheering) : ''}
        </td>
      </tr>
    </table>

    <!-- Action buttons -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="padding-right:8px">
          <a href="${approveUrl}"
            style="display:block;text-align:center;background:#166534;color:#ffffff;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            ✅ Approve
          </a>
        </td>
        <td width="48%" style="padding-left:8px">
          <a href="${denyUrl}"
            style="display:block;text-align:center;background:#991b1b;color:#ffffff;padding:14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            ❌ Deny
          </a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;margin:20px 0 0;color:#9ca3af;font-size:12px">
      Or <a href="${adminPanelUrl}" style="color:#1e3a5f">open the admin panel</a> to manage all players.
      These one-click links expire in 7 days.
    </p>
  `)
}

/* ─── Template 3 — Player: account approved ────────────────── */
export function approvedEmailHtml(name: string, loginUrl: string) {
  return wrap(`
    <h2 style="margin:0 0 6px;color:#166534;font-size:22px;font-weight:900">🎉 You're approved!</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Hi <strong>${esc(name)}</strong> — great news! Your FIFAFun account has been approved.
      Log in now and start predicting World Cup 2026 matches for bragging rights!
    </p>
    ${btn(loginUrl, '⚽ Log in and play', '#166534')}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-top:8px">
      <p style="margin:0;color:#14532d;font-size:12px;line-height:1.6">
        🏆 Predict match scores, use your Joker wisely, and answer bonus questions to climb the leaderboard.
        May the best predictor win!
      </p>
    </div>
  `)
}

/* ─── Template 4 — Player: account denied ──────────────────── */
export function deniedEmailHtml(name: string, adminEmail: string) {
  return wrap(`
    <h2 style="margin:0 0 6px;color:#1e3a5f;font-size:20px;font-weight:900">FIFAFun account update</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Hi <strong>${esc(name)}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Unfortunately we were unable to approve your FIFAFun account at this time.
      This pool is intended for friends and family of the organizers.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6">
      If you think this is a mistake, please reach out to the admin at
      <a href="mailto:${adminEmail}" style="color:#1e3a5f">${adminEmail}</a>.
    </p>
  `)
}

/* ─── Helpers ───────────────────────────────────────────────── */
function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function row(label: string, value: string) {
  return `<p style="margin:0 0 8px;font-size:13px;color:#374151">
    <span style="color:#6b7280;min-width:110px;display:inline-block">${label}:</span>
    <strong style="color:#111827">${esc(value)}</strong>
  </p>`
}
