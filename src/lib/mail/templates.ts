/** Plain functions that return the subject, text and HTML of each email. No I/O — easy to test. */

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One branded shell for every message: a heading, paragraphs, and an optional button. */
function layout(input: { heading: string; paragraphs: string[]; button?: { label: string; url: string }; footnote?: string }): string {
  const paragraphs = input.paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1f2937">${p}</p>`).join('');
  const button = input.button
    ? `<p style="margin:22px 0"><a href="${esc(input.button.url)}" style="display:inline-block;background:#c7141c;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px">${esc(input.button.label)}</a></p>
       <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:#6b7280">Button not working? Copy this link into your browser:<br><span style="word-break:break-all">${esc(input.button.url)}</span></p>`
    : '';
  const footnote = input.footnote ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#6b7280">${input.footnote}</p>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e5e7eb">
<p style="margin:0 0 18px;font-size:20px;font-weight:800;color:#c7141c">Jetking</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#111827">${esc(input.heading)}</h1>
${paragraphs}${button}${footnote}
</div></body></html>`;
}

/** A new staff member: where to sign in, the email to use, and the temporary password the admin set. */
export function staffWelcomeEmail(input: { name: string; email: string; password: string; loginUrl: string; roleLabel: string }): EmailContent {
  const { name, email, password, loginUrl, roleLabel } = input;
  return {
    subject: 'Your Jetking admin account',
    text: [
      `Hi ${name},`,
      '',
      `An account has been created for you on the Jetking admin panel (role: ${roleLabel}).`,
      '',
      `Sign in: ${loginUrl}`,
      `Email: ${email}`,
      `Temporary password: ${password}`,
      '',
      'Please change your password after signing in (My account → Change password).',
    ].join('\n'),
    html: layout({
      heading: `Welcome, ${name}`,
      paragraphs: [
        `An account has been created for you on the Jetking admin panel. Your role is <strong>${esc(roleLabel)}</strong>.`,
        `<strong>Email:</strong> ${esc(email)}<br><strong>Temporary password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${esc(password)}</code>`,
      ],
      button: { label: 'Sign in', url: loginUrl },
      footnote: 'Please change your password after signing in: My account → Change password. If you were not expecting this, ignore this email.',
    }),
  };
}

/** An admin set a new password for a staff member. */
export function staffPasswordResetEmail(input: { name: string; email: string; password: string; loginUrl: string }): EmailContent {
  const { name, email, password, loginUrl } = input;
  return {
    subject: 'Your Jetking admin password was reset',
    text: [
      `Hi ${name},`,
      '',
      'An administrator reset your Jetking admin password.',
      '',
      `Sign in: ${loginUrl}`,
      `Email: ${email}`,
      `New temporary password: ${password}`,
      '',
      'Please change it after signing in (My account → Change password). If you did not expect this, tell your administrator.',
    ].join('\n'),
    html: layout({
      heading: 'Your password was reset',
      paragraphs: [
        `Hi ${esc(name)}, an administrator reset your Jetking admin password.`,
        `<strong>Email:</strong> ${esc(email)}<br><strong>New temporary password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${esc(password)}</code>`,
      ],
      button: { label: 'Sign in', url: loginUrl },
      footnote: 'Please change it after signing in: My account → Change password. If you did not expect this, tell your administrator.',
    }),
  };
}

/** A website visitor asked to reset their password: a single-use link that expires. */
export function visitorResetEmail(input: { name: string; resetUrl: string; minutes: number }): EmailContent {
  const { name, resetUrl, minutes } = input;
  return {
    subject: 'Reset your Jetking password',
    text: [
      `Hi ${name},`,
      '',
      'We received a request to reset the password for your Jetking account.',
      `Open this link to choose a new password (it works once and expires in ${minutes} minutes):`,
      resetUrl,
      '',
      'If you did not ask for this, you can ignore this email — your password will not change.',
    ].join('\n'),
    html: layout({
      heading: 'Reset your password',
      paragraphs: [
        `Hi ${esc(name)}, we received a request to reset the password for your Jetking account.`,
        `Use the button below to choose a new password. The link works once and expires in ${minutes} minutes.`,
      ],
      button: { label: 'Choose a new password', url: resetUrl },
      footnote: 'If you did not ask for this, you can ignore this email — your password will not change.',
    }),
  };
}
