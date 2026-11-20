// Points Supabase Auth at Resend SMTP, raises the email rate limit, and installs sign-in email templates
// that include the one-time code. Run ONLY after the sending domain is verified in Resend:
//   node scripts/supabase-smtp.mjs noreply@thypro.app
// Needs SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF and RESEND_API_KEY in .env.local (never committed).
import { existsSync, readFileSync } from 'node:fs';

function env(name) {
  if (process.env[name]) return process.env[name];
  if (!existsSync('.env.local')) return undefined;
  return readFileSync('.env.local', 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1].trim();
}

const from = process.argv[2];
const token = env('SUPABASE_ACCESS_TOKEN');
const ref = env('SUPABASE_PROJECT_REF');
const resend = env('RESEND_API_KEY');
if (!from || !token || !ref || !resend) {
  console.error('usage: node scripts/supabase-smtp.mjs <sender@verified-domain>   (needs the three env values)');
  process.exit(2);
}

// Refuse to switch if Resend would reject this sender: that would break sign-in for everyone.
const probe = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: `Thypro <${from}>`, to: ['delivered@resend.dev'], subject: 'Thypro SMTP check', text: 'ok' })
});
if (!probe.ok) {
  console.error('Resend rejected this sender, so Supabase was NOT changed:', probe.status, (await probe.text()).slice(0, 200));
  process.exit(1);
}

const tpl = (heading) =>
  `<h2>${heading}</h2><p>Your sign-in code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>` +
  `<p>Or <a href="{{ .ConfirmationURL }}">use this link</a> on the same device.</p>` +
  `<p>If you did not ask for this, ignore this email. Thypro is a demonstration build, not a medical service.</p>`;

const body = {
  external_email_enabled: true,
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  smtp_pass: resend,
  smtp_admin_email: from,
  smtp_sender_name: 'Thypro',
  rate_limit_email_sent: 30,
  mailer_subjects_magic_link: 'Your Thypro sign-in code',
  mailer_templates_magic_link_content: tpl('Sign in to Thypro'),
  mailer_subjects_confirmation: 'Confirm your Thypro account',
  mailer_templates_confirmation_content: tpl('Welcome to Thypro')
};
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
console.log(res.status, res.ok ? 'Supabase auth now sends through Resend. Set VITE_AUTH_CODE_ENTRY=1 to show the code box.' : (await res.text()).slice(0, 300));
process.exit(res.ok ? 0 : 1);
