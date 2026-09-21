import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Minimal mailer used for password-reset emails (module 3).
 *
 * When `SMTP_HOST` is not configured (the default in development) the email is
 * logged to the server console instead of being sent, which keeps flows fully
 * testable without an SMTP server.
 */

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const active = getTransporter();
  if (!active) {
    logger.info(`[mailer:dev] Email to ${params.to}: ${params.subject}`);
    logger.info(`[mailer:dev] ${params.text}`);
    return;
  }
  await active.sendMail({
    from: env.MAIL_FROM || env.SMTP_USER,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}