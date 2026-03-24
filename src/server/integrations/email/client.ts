import { env } from "../shared/env.js";
import { ApiError, withApiHandler } from "../shared/http.js";
import { Logger } from "./logger.js";

const logger = new Logger({ integration: "resend" });
const MAX_RETRIES = 2;
const TIMEOUT_MS = 10000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const apiKey = env.RESEND_API_KEY;
  const from = input.from || env.EMAIL_FROM;

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: input.subject,
          html: input.html,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        if (attempt < MAX_RETRIES && (response.status >= 500 || response.status === 429)) {
          logger.warn(`Email temporary error (${response.status}). Attempt ${attempt}/${MAX_RETRIES}`, { to: input.to });
          await sleep(1000 * attempt);
          continue;
        }
        logger.error(`Email API Error: ${response.status}`, { error, to: input.to });
        throw new ApiError(502, "Failed to send email via Resend", error);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < MAX_RETRIES) {
        logger.warn(`Email attempt ${attempt} failed: ${error.message}. Retrying...`, { to: input.to });
        await sleep(1000 * attempt);
        continue;
      }
    }
  }

  throw new ApiError(502, `Email total failure: ${lastError.message}`);
}

export async function sendMagicLinkEmail(to: string, url: string) {
  return sendEmail({
    to,
    subject: "Seu link de acesso - Receitas Bell",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Acesse sua conta</h1>
        <p>Clique no botão abaixo para acessar o portal de receitas:</p>
        <a href="${url}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Acessar Agora
        </a>
        <p style="margin-top: 24px; font-size: 14px; color: #666;">
          Este link expira em 15 minutos. Se você não solicitou este acesso, ignore este e-mail.
        </p>
      </div>
    `,
  });
}
