import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Outgoing email over SMTP, configured entirely from `MAIL_*` env vars (see `.env.production.example`).
 * Off unless `MAIL_DRIVER=smtp` and the host/credentials are present — callers treat "not configured" as a
 * normal state (the feature still works, the email just is not sent), never as an error.
 */

interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromAddress: string;
  /** 'TLS' = STARTTLS upgrade (port 587), 'SSL' = implicit TLS (port 465), 'NONE' = plain. */
  encryption: 'TLS' | 'SSL' | 'NONE';
}

function readConfig(): MailConfig | null {
  if ((process.env.MAIL_DRIVER ?? '').trim().toLowerCase() !== 'smtp') return null;
  const host = process.env.MAIL_HOST?.trim();
  const username = process.env.MAIL_USERNAME?.trim();
  const password = process.env.MAIL_PASSWORD;
  if (!host || !username || !password) return null;

  const port = Number(process.env.MAIL_PORT);
  const encryption = (process.env.MAIL_ENCRYPTION ?? 'TLS').trim().toUpperCase();
  return {
    host,
    port: Number.isInteger(port) && port > 0 ? port : 587,
    username,
    password,
    fromName: process.env.MAIL_FROM_NAME?.trim() || 'Jetking',
    fromAddress: process.env.MAIL_FROM_ADDRESS?.trim() || username,
    encryption: encryption === 'SSL' ? 'SSL' : encryption === 'NONE' ? 'NONE' : 'TLS',
  };
}

export function isMailConfigured(): boolean {
  return readConfig() !== null;
}

let cached: { key: string; transport: Transporter } | null = null;

function transportFor(config: MailConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.username}:${config.encryption}`;
  if (cached?.key === key) return cached.transport;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.encryption === 'SSL',
    requireTLS: config.encryption === 'TLS',
    auth: { user: config.username, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  cached = { key, transport };
  return transport;
}

export type SendResult = { ok: true } | { ok: false; error: string };

/** Never lets the SMTP password (or a message body) reach logs: only a short, scrubbed reason is returned. */
function describeError(error: unknown, config: MailConfig): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.split(config.password).join('***').replace(/\s+/g, ' ').slice(0, 200);
}

export async function sendMail(message: { to: string; subject: string; text: string; html: string }): Promise<SendResult> {
  const config = readConfig();
  if (!config) return { ok: false, error: 'Email is not configured.' };
  try {
    await transportFor(config).sendMail({
      from: { name: config.fromName, address: config.fromAddress },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (error) {
    const reason = describeError(error, config);
    // The recipient address is personal data: log the failure, not who it was for.
    console.error('[mail:send-failed]', reason);
    return { ok: false, error: reason };
  }
}
