import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { ApiError } from '../shared/http.js';
import { Logger } from '../shared/logger.js';
import { getTenantBySlug } from '../tenancy/repo.js';
import { requireTenantFromRequest } from '../tenancy/resolver.js';
import { createSession } from '../auth/sessions.js';
import { auditLog } from '../audit/service.js';
import { assertStrongAdminPassword, hashAdminPassword } from '../auth/passwords.js';
import { findUserByEmailForTenant, createUser, updateUserPasswordCredentials } from '../identity/repo.js';
import { readAdminSession } from './auth.js';

// Configuração de invites
const INVITE_TOKEN_LENGTH = 32;
const INVITE_EXPIRY_HOURS = 24;

export type InviteStatus = 'valid' | 'expired' | 'invalid' | 'used';

export interface ValidateInviteData {
  status: InviteStatus;
  email?: string;
  tenantName?: string;
  tenantSlug?: string;
  message?: string;
}

/**
 * Gera um token seguro para convite de admin
 */
export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_LENGTH).toString('hex');
}

/**
 * Calcula expiração do token (24 horas)
 */
function getInviteExpiration(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + INVITE_EXPIRY_HOURS);
  return expiry;
}

/**
 * Valida um token de convite
 * Nota: Em produção, isso deveria consultar uma tabela `admin_invites`
 * Por enquanto, retornamos um template de resposta
 */
export async function validateAdminInviteToken(
  token: string,
  options: { logger?: Logger } = {}
): Promise<ValidateInviteData> {
  const logger = options.logger ?? new Logger('invite-validation');

  if (!token || token.length < 10) {
    throw new ApiError(400, 'Token inválido');
  }

  // TODO: Implementar consulta a tabela `admin_invites` quando estiver disponível
  // Por agora, simulamos validação baseada no formato do token
  try {
    // Simulação: tokens que começam com "valid_" são válidos, "expired_" são expirados
    if (token.startsWith('valid_')) {
      return {
        status: 'valid',
        email: 'convidado@example.com',
        tenantName: 'Receitas Bell',
        tenantSlug: 'receitasbell',
        message: 'Convite válido até 24 horas.',
      };
    }

    if (token.startsWith('expired_')) {
      return {
        status: 'expired',
        message: 'Este convite expirou.',
      };
    }

    if (token.startsWith('used_')) {
      return {
        status: 'used',
        message: 'Este convite já foi utilizado.',
      };
    }

    // Padrão: inválido
    return {
      status: 'invalid',
      message: 'Convite não encontrado ou inválido.',
    };
  } catch (error) {
    logger.error('Error validating invite token', { error });
    throw new ApiError(500, 'Erro ao validar convite');
  }
}

/**
 * Aceita um convite definindo a senha inicial do admin
 */
export async function acceptAdminInvite(
  request: VercelRequest,
  response: VercelResponse,
  input: {
    token: string;
    password: string;
    tenantSlug?: string;
    logger?: Logger;
  }
) {
  const logger = input.logger ?? Logger.fromRequest(request);

  try {
    // Validar força da senha
    assertStrongAdminPassword(input.password, 'senha');

    // Validar token e obter dados
    const inviteData = await validateAdminInviteToken(input.token, { logger });

    if (inviteData.status !== 'valid') {
      throw new ApiError(
        inviteData.status === 'expired' ? 410 : 400,
        inviteData.message || 'Convite inválido'
      );
    }

    // Resolver tenant
    let tenant;
    if (input.tenantSlug) {
      const bySlug = await getTenantBySlug(input.tenantSlug);
      if (!bySlug) {
        throw new ApiError(404, 'Tenant não encontrado');
      }
      tenant = bySlug;
    } else if (inviteData.tenantSlug) {
      const bySlug = await getTenantBySlug(inviteData.tenantSlug);
      if (!bySlug) {
        throw new ApiError(404, 'Tenant não encontrado');
      }
      tenant = bySlug;
    } else {
      ({ tenant } = await requireTenantFromRequest(request));
    }

    const email = inviteData.email;
    if (!email) {
      throw new ApiError(400, 'E-mail do convite não encontrado');
    }

    // Verificar se usuário já existe
    let user = await findUserByEmailForTenant(
      { id: String(tenant.id), slug: tenant.slug, name: tenant.name },
      email
    );

    // Se usuário não existe, criar
    if (!user) {
      const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = await createUser({
        userId,
        tenantId: String(tenant.id),
        email,
        role: 'admin',
        status: 'active',
      });
    } else if (user.status === 'inactive') {
      // Reativar usuário se estava inativo
      await updateUserPasswordCredentials({
        userId: user.id,
      });
    }

    // Hash da senha
    const passwordHash = await hashAdminPassword(input.password);

    // Atualizar credenciais do usuário
    await updateUserPasswordCredentials({
      userId: user.id,
      passwordHash,
    });

    // Criar sessão
    await createSession(request, response, {
      tenantId: String(tenant.id),
      userId: String(user.id),
      email: user.email,
      role: 'admin',
    });

    // Audit log
    await auditLog({
      tenantId: String(tenant.id),
      userId: String(user.id),
      action: 'admin.invite.accepted',
      metadata: { email, tenantSlug: tenant.slug },
    });

    logger.info('Admin invite accepted', {
      tenantId: String(tenant.id),
      userId: String(user.id),
      email,
    });

    // Retornar sessão
    return readAdminSession(request);
  } catch (error) {
    logger.error('Error accepting admin invite', { error, token: input.token?.slice(0, 10) });
    throw error;
  }
}

/**
 * Solicita um novo convite (para caso anterior tenha expirado)
 * Nota: Implementação completa requer integração com email/fila
 */
export async function requestNewAdminInvite(
  tenantId: string,
  email: string,
  reason?: string,
  options: { logger?: Logger } = {}
): Promise<{ success: boolean; message: string }> {
  const logger = options.logger ?? new Logger('invite-request');

  try {
    // TODO: Implementar envio de e-mail via fila ou serviço de e-mail
    logger.info('Admin invite request recorded', {
      tenantId,
      email,
      reason,
    });

    return {
      success: true,
      message: 'Solicitação registrada. Um novo convite será enviado em breve.',
    };
  } catch (error) {
    logger.error('Error requesting new invite', { error, email });
    throw new ApiError(500, 'Erro ao solicitar novo convite');
  }
}
