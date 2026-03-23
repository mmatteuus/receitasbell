import { getRequiredEnv, getOptionalEnv } from "../env.js";
import { ApiError } from "../http.js";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = input.from || getOptionalEnv("EMAIL_FROM") || "contato@receitasbell.com.br";

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
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(502, "Failed to send email via Resend", error);
  }

  return response.json();
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
