import type { VercelRequest, VercelResponse } from "@vercel/node";
import { completeMercadoPagoOAuth } from "../../../src/server/mercadopago/oauth.js";
import { ApiError, withApiHandler } from "../../../src/server/http.js";
import { getPrisma } from "../../../src/server/db/prisma.js";
import { createTenantBootstrap } from "../../../src/server/tenants/service.js";
import { createTenantAdminSession, setTenantAdminSessionCookie } from "../../../src/server/auth/sessions.js";

function buildRedirectUrl(request: VercelRequest, path: string) {
  const base = process.env.APP_BASE_URL?.trim() || `http://${request.headers.host || "localhost"}`;
  return new URL(path, base).toString();
}

function redirect(response: VercelResponse, location: string) {
  response.status(302).setHeader("Location", location).end();
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const code = Array.isArray(request.query.code) ? request.query.code[0] : request.query.code;
    const state = Array.isArray(request.query.state) ? request.query.state[0] : request.query.state;

    if (!code || !state) {
      throw new ApiError(400, "OAuth code ou state ausente.");
    }

    try {
      const result = await completeMercadoPagoOAuth({
        code: String(code),
        state: String(state),
      });

      // Se o tenant for "system", é um fluxo de login/onboarding
      if (result.tenantId === "system") {
        const prisma = getPrisma();
        
        // Procurar se já existe um tenant para este Mercado Pago ID
        const existingConn = await prisma.mercadoPagoConnection.findFirst({
          where: { mercadoPagoUserId: result.connection.mercadoPagoUserId },
          include: { tenant: { include: { users: true } } }
        });

        let targetTenantId = existingConn?.tenantId;
        let targetUserId = existingConn?.tenant?.users[0]?.id;

        if (!existingConn) {
          // ONBOARDING: Criar novo tenant automaticamente
          const mpId = result.connection.mercadoPagoUserId;
          const { tenant, tenantUser } = await createTenantBootstrap({
            tenantName: `Loja ${mpId}`,
            tenantSlug: `loja-${mpId}`,
            adminEmail: `admin-${mpId}@receitasbell.com.br`,
            adminPassword: Math.random().toString(36).slice(-10),
          });
          
          targetTenantId = tenant.id;
          targetUserId = tenantUser.id;

          // Vincular a conexão criada no completeMercadoPagoOAuth ao novo tenant
          await prisma.mercadoPagoConnection.update({
            where: { id: result.connection.id },
            data: { tenantId: targetTenantId }
          });
        }

        // Criar sessão para o usuário
        if (targetTenantId && targetUserId) {
          const { token, expiresAt } = await createTenantAdminSession({ 
            tenantId: targetTenantId, 
            tenantUserId: targetUserId 
          });
          setTenantAdminSessionCookie(request, response, token, expiresAt);
          return redirect(response, buildRedirectUrl(request, "/admin?onboarding=1"));
        }
      }

      // Fluxo normal de configuração (usuário já logado)
      const separator = result.returnTo.includes("?") ? "&" : "?";
      redirect(response, buildRedirectUrl(request, `${result.returnTo}${separator}connected=1`));
    } catch (error) {
      console.error("Mercado Pago OAuth Error:", error);
      const fallback = "/admin/login?error=mp_oauth_failed";
      redirect(response, buildRedirectUrl(request, fallback));
    }
  });
}
