import { Prisma, type MercadoPagoConnection } from "@prisma/client";
import { getPrisma } from "../db/prisma.js";
import { decryptSecret, encryptSecret } from "../security/crypto.js";
import { redactErrorMessage } from "../security/masking.js";
import { ApiError } from "../http.js";
import { getMercadoPagoAppEnv } from "../env.js";

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number | string;
  public_key?: string;
};

function computeTokenExpiresAt(expiresIn?: number | null) {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null;
  return new Date(Date.now() + Math.max(0, Number(expiresIn) - 60) * 1000);
}

async function writeAuditLog(input: {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await getPrisma().auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadataJson: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

export async function getTenantMercadoPagoConnection(tenantId: string) {
  return getPrisma().mercadoPagoConnection.findUnique({
    where: { tenantId },
  });
}

export async function requireTenantMercadoPagoConnection(tenantId: string) {
  const connection = await getTenantMercadoPagoConnection(tenantId);
  if (!connection) {
    throw new ApiError(409, "Conecte uma conta do Mercado Pago antes de ativar pagamentos.");
  }
  return connection;
}

export function readConnectionSecrets(connection: MercadoPagoConnection) {
  return {
    accessToken: decryptSecret(connection.accessTokenEncrypted),
    refreshToken: decryptSecret(connection.refreshTokenEncrypted),
  };
}

export async function upsertTenantMercadoPagoConnection(input: {
  tenantId: string;
  mercadoPagoUserId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  scope?: string | null;
  publicKey?: string | null;
  actorUserId?: string | null;
}) {
  const prisma = getPrisma();
  const connection = await prisma.mercadoPagoConnection.upsert({
    where: { tenantId: input.tenantId },
    update: {
      mercadoPagoUserId: input.mercadoPagoUserId,
      accessTokenEncrypted: encryptSecret(input.accessToken),
      refreshTokenEncrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      tokenExpiresAt: computeTokenExpiresAt(input.expiresIn),
      scope: input.scope ?? null,
      status: "connected",
      lastError: null,
      publicKey: input.publicKey ?? null,
      connectedAt: new Date(),
      disconnectedAt: null,
    },
    create: {
      tenantId: input.tenantId,
      mercadoPagoUserId: input.mercadoPagoUserId,
      accessTokenEncrypted: encryptSecret(input.accessToken),
      refreshTokenEncrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      tokenExpiresAt: computeTokenExpiresAt(input.expiresIn),
      scope: input.scope ?? null,
      status: "connected",
      publicKey: input.publicKey ?? null,
      connectedAt: new Date(),
    },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "mercado_pago.connection.upserted",
    entityType: "mercado_pago_connection",
    entityId: connection.id,
    metadata: {
      mercadoPagoUserId: input.mercadoPagoUserId,
      hasRefreshToken: Boolean(input.refreshToken),
      scope: input.scope ?? null,
    },
  });

  return connection;
}

export async function disconnectTenantMercadoPagoConnection(input: {
  tenantId: string;
  actorUserId?: string | null;
}) {
  const prisma = getPrisma();
  const connection = await prisma.mercadoPagoConnection.findUnique({
    where: { tenantId: input.tenantId },
  });

  if (!connection) {
    return null;
  }

  const updated = await prisma.mercadoPagoConnection.update({
    where: { tenantId: input.tenantId },
    data: {
      accessTokenEncrypted: "",
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      status: "disconnected",
      disconnectedAt: new Date(),
      lastError: null,
    },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "mercado_pago.connection.disconnected",
    entityType: "mercado_pago_connection",
    entityId: updated.id,
  });

  return updated;
}

export async function markConnectionReconnectRequired(input: {
  connectionId: string;
  message: string;
}) {
  const connection = await getPrisma().mercadoPagoConnection.update({
    where: { id: input.connectionId },
    data: {
      status: "reconnect_required",
      lastError: input.message.slice(0, 1000),
    },
  });

  await writeAuditLog({
    tenantId: connection.tenantId,
    action: "mercado_pago.connection.reconnect_required",
    entityType: "mercado_pago_connection",
    entityId: connection.id,
    metadata: {
      error: input.message.slice(0, 500),
    },
  });

  return connection;
}

export async function refreshMercadoPagoConnection(connectionId: string) {
  const prisma = getPrisma();
  const connection = await prisma.mercadoPagoConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection) {
    throw new ApiError(404, "Mercado Pago connection not found.");
  }

  const refreshToken = decryptSecret(connection.refreshTokenEncrypted);
  if (!refreshToken) {
    await markConnectionReconnectRequired({
      connectionId: connection.id,
      message: "Refresh token unavailable.",
    });
    throw new ApiError(409, "A conexão com o Mercado Pago precisa ser refeita.");
  }

  const { clientId, clientSecret } = getMercadoPagoAppEnv();
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const body = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!response.ok || !body?.access_token) {
    const message = `Mercado Pago refresh failed: ${response.status} ${redactErrorMessage(body ?? response.statusText)}`;
    await markConnectionReconnectRequired({
      connectionId: connection.id,
      message,
    });
    throw new ApiError(409, "A conexão com o Mercado Pago expirou. Reconecte a conta para continuar.");
  }

  return upsertTenantMercadoPagoConnection({
    tenantId: connection.tenantId,
    actorUserId: null,
    mercadoPagoUserId: String(body.user_id ?? connection.mercadoPagoUserId),
    accessToken: body.access_token,
    refreshToken: body.refresh_token || refreshToken,
    expiresIn: body.expires_in ?? null,
    scope: body.scope ?? connection.scope,
    publicKey: body.public_key ?? connection.publicKey,
  });
}

export async function getUsableMercadoPagoAccessToken(tenantId: string) {
  const connection = await requireTenantMercadoPagoConnection(tenantId);
  if (connection.status === "disconnected") {
    throw new ApiError(409, "A conta do Mercado Pago está desconectada.");
  }
  if (connection.status === "reconnect_required") {
    throw new ApiError(409, "A conta do Mercado Pago precisa ser reconectada.");
  }

  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() <= Date.now()) {
    const refreshed = await refreshMercadoPagoConnection(connection.id);
    return {
      connection: refreshed,
      accessToken: decryptSecret(refreshed.accessTokenEncrypted),
    };
  }

  return {
    connection,
    accessToken: decryptSecret(connection.accessTokenEncrypted),
  };
}
