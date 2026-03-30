# Dossiê Específico — Mercado Pago, Admin Payments e PWA

---

## 1. Objetivo

Este arquivo concentra a investigação e a correção de:
- build quebrado por código do Mercado Pago
- `500` em `/api/admin/payments/settings`
- `500` em `/api/admin/payments?...dateFrom=...`
- drift entre código endurecido e dados reais do Baserow
- warning do PWA icon

---

## 2. Diagnóstico consolidado do Mercado Pago

## FATO
O backend já tem:
- cliente dedicado do Mercado Pago
- módulo de conexões por tenant
- readiness para produção/sandbox
- connect/disconnect
- teste de UI admin mockada
- avaliação de `productionReady`, `blockingReasons` e `effectiveCheckoutUrlKind`

## FATO
O storage real de `mercado_pago_connections` mostrou:
- rows legadas
- campos plain antigos ainda presentes
- campos novos endurecidos parcialmente nulos
- sinais de coexistência entre modelo antigo e novo

## FATO
A rota `/api/admin/payments/settings` existe e, sem sessão admin, responde 403 de forma normal.  
Logo, o `500` só acontece depois do gate de auth passar.

### Conclusão
O problema **não é ausência de rota**.  
O problema é **estado operacional quebrado ou tolerância insuficiente do código para esse estado**.

---

## 3. TASK-MP-001 — corrigir o build quebrado

**Objetivo:** eliminar o merge conflict commitado no cliente Mercado Pago.

**Arquivos-alvo**
- `src/server/integrations/mercadopago/client.ts`

**Passos exatos**
1. Abrir o arquivo.
2. Remover completamente marcadores `<<<<<<<`, `=======`, `>>>>>>>`.
3. Manter somente **uma** versão de `MercadoPagoPaymentMethod`.
4. Manter somente **uma** função pública `mpGetPaymentMethods`.
5. Garantir compatibilidade com `src/server/integrations/mercadopago/methods.ts`.

**Código a aplicar**
```ts
export async function mpGetPaymentMethods(accessToken: string): Promise<MercadoPagoPaymentMethod[]> {
  const response = await mpFetch(
    "https://api.mercadopago.com/v1/payment_methods",
    { headers: authHeaders(accessToken) },
    1,
  );

  if (!response.ok) {
    const payload = await parseJsonSafe(response);
    throw new MercadoPagoApiError(
      response.status,
      `MP get payment methods failed ${response.status}`,
      payload,
    );
  }

  try {
    const data = await response.json();
    return Array.isArray(data) ? (data as MercadoPagoPaymentMethod[]) : [];
  } catch {
    return [];
  }
}
```

**Comandos**
```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run gate
```

**Critério de aceite**
- parser não quebra
- build passa
- import de `mpGetPaymentMethods` continua resolvendo

**Rollback**
```bash
git checkout -- src/server/integrations/mercadopago/client.ts
```

**Protocolo de não-quebra**
- mudança corretiva
- sem alteração funcional nova
- baixo risco

---

## 4. TASK-MP-002 — normalizar conexões reais do Mercado Pago

**Objetivo:** sanar drift entre dados legados e o código atual de conexões.

**Arquivos-alvo**
- `scripts/mercadopago-normalize-connections.cjs` (criar)
- `src/server/integrations/mercadopago/connections.ts` (ajuste mínimo se necessário)
- `/backend/audit/mercadopago-connections-normalization.md` (criar no pacote de docs do projeto)

**Pré-requisito**
- TASK-MP-001 concluída

**Passos exatos**
1. Exportar snapshot da tabela `mercado_pago_connections`.
2. Criar script idempotente que:
   - lê todas as rows
   - detecta rows do mesmo tenant
   - identifica tokens plain herdados
   - preenche campos endurecidos ausentes
   - desconecta rows ativas duplicadas
3. Registrar relatório de quantas linhas foram:
   - mantidas
   - corrigidas
   - desconectadas
4. Rodar leitura final com a mesma regra de `getTenantMercadoPagoConnection()`.

**Script proposto**
```js
// scripts/mercadopago-normalize-connections.cjs
// pseudo-código operacional:
// 1. carregar rows
// 2. agrupar por tenant
// 3. sort pela mais recente
// 4. para row mantida:
//    - preencher status=connected/disconnected/reconnect_required
//    - connected_at = created_at se vazio
//    - updated_at = now se vazio
//    - copiar access_token -> access_token_encrypted quando necessário
// 5. para rows excedentes ativas:
//    - status=disconnected
//    - disconnected_at=now
//    - last_error=connection_repaired_duplicate_active
```

**Regra de ouro**
- **não deletar rows**
- apenas patch reversível
- sempre manter snapshot prévio

**Critério de aceite**
- `/api/admin/payments/settings` responde 200 autenticado
- `connectionStatus` não causa exception
- `blockingReasons`, `productionReady`, `webhookUrl` e `effectiveCheckoutUrlKind` aparecem corretamente

**Validação**
```bash
npm run test:unit
curl -H "Cookie: <admin_session>" https://SEU_HOST/api/admin/payments/settings
```

**Output esperado**
```json
{
  "settings": {
    "connectionStatus": "connected|disconnected|reconnect_required",
    "productionReady": true|false,
    "blockingReasons": []
  }
}
```

**Risco**
- médio, porque toca dados reais

**Rollback**
- restaurar snapshot
- reverter script de patch

**Feature flag**
- não

**Protocolo de não-quebra**
- snapshot obrigatório
- zero delete destrutivo
- canário funcional: validar primeiro em tenant interno

---

## 5. TASK-MP-003 — endurecer leitura do readiness admin

**Objetivo:** tornar `getTenantAdminPaymentSettings()` resiliente a dados legados incompletos.

**Arquivos-alvo**
- `src/server/admin/payments.ts`
- `src/server/integrations/mercadopago/connections.ts`

**Passos**
1. Garantir que `getTenantMercadoPagoConnection()` nunca quebre por:
   - `connected_at` vazio
   - `updated_at` vazio
   - `status` vazio
   - `access_token_encrypted` vazio com `access_token` presente
2. Tratar ausência de campos como estado degradado e não como exception.
3. Se o token existir mas o shape estiver parcial, marcar como:
   - `connected` ou `reconnect_required`
   - nunca explodir 500 sem detalhar

**Snippets**
```ts
function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v : null;
}
```

```ts
function safeIso(value: unknown): string | null {
  const v = safeString(value);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
```

**Critério de aceite**
- settings sempre devolve payload útil
- degradação controlada em vez de 500

---

## 6. TASK-MP-004 — sanear Payment Orders reais

**Objetivo:** impedir que rows placeholder derrubem o admin.

**Achado**
Rows inteiramente nulas/inúteis já foram observadas na tabela operacional de Payment Orders.

**Arquivos-alvo**
- `scripts/payment-orders-sanitize.cjs` (criar)
- `src/server/payments/repo.ts`

**Passos**
1. Exportar snapshot da tabela.
2. Criar script que detecte rows inválidas quando os campos críticos estiverem vazios.
3. Marcar rows ruins como inválidas ou removê-las somente após snapshot e confirmação.
4. Em código, ignorar rows inválidas antes de `mapRowToPayment`.

**Snippet recomendado**
```ts
function isValidPaymentOrderRow(row: PaymentOrderRow) {
  return Boolean(
    row &&
    row.tenant_id &&
    row.created_at &&
    (
      row.external_reference ||
      row.payer_email ||
      row.mp_payment_id ||
      row.preference_id
    )
  );
}
```

Aplicação:
```ts
const orders = rows
  .filter(isValidPaymentOrderRow)
  .map(mapRowToPayment);
```

**Critério de aceite**
- `/api/admin/payments` volta a responder 200 autenticado
- filtro por data não quebra
- rows lixo não aparecem

**Risco**
- médio

**Rollback**
- restaurar snapshot
- reverter filtro em código se necessário

---

## 7. TASK-MP-005 — blindar testes do admin payments

**Objetivo:** transformar o bug real em teste de regressão.

**Arquivos-alvo**
- `tests/admin-payments-realworld-regression.test.ts` (criar)
- `tests/admin-payments-readiness.test.ts` (ajustar se necessário)

**Casos novos**
1. settings com connection row legada sem `status`
2. settings com `access_token` plain e sem encrypted
3. connections duplicadas no mesmo tenant
4. payment orders com rows inválidas/nulas
5. payments list com `dateFrom` e rows sujas

**Critério de aceite**
- teste falha antes da correção
- teste passa depois da correção

---

## 8. Warning do ícone PWA

## Diagnóstico
O manifest aponta para:
- `/pwa/icons/icon-192.png`
- `/pwa/icons/icon-512.png`
- `/pwa/icons/icon-maskable-192.png`
- `/pwa/icons/icon-maskable-512.png`

O warning do browser indica uma destas causas:
1. arquivo não existe no build final
2. arquivo existe, mas não é PNG válido
3. caminho serve HTML ou erro em vez de imagem
4. mime incorreto
5. asset foi gerado/commitado errado

### TASK-PWA-001 — validar assets reais
**Arquivos-alvo**
- `public/pwa/icons/*`
- `vite.config.ts`
- possível pipeline de build/asset copy

**Passos**
1. Verificar presença física dos 4 arquivos.
2. Validar dimensões e formato PNG reais.
3. Rodar build local.
4. Conferir se os arquivos saem no `dist`.
5. Conferir se deploy responde `Content-Type: image/png`.

**Comandos**
```bash
file public/pwa/icons/icon-192.png
file public/pwa/icons/icon-512.png
npm run build
find dist -path "*pwa/icons*"
```

**Critério de aceite**
- browser não mostra mais warning do manifest
- abrir a URL do PNG retorna imagem válida

### Se os arquivos estiverem ausentes ou inválidos
Gerar novamente os 4 ícones a partir de uma fonte única e substituir.

**Risco**
- baixo

**Rollback**
- restaurar assets anteriores

---

## 9. Hardening extra obrigatório

### Rotação de segredos
Como houve evidência de material sensível em storage operacional:
- rotacionar client secret
- rotacionar webhook secret
- revisar tokenizações
- migrar qualquer dependência de plaintext para storage seguro
- remover dependência de valor operacional em Settings sempre que o código já usar env/secret manager

### Observabilidade mínima para este domínio
Adicionar logs estruturados com:
- `action`
- `tenantId`
- `connectionStatus`
- `provider`
- `degraded`
- `requestId`
- `reason`

Exemplo:
```ts
logger.info("mercadopago.admin_settings.readiness", {
  action: "mercadopago.admin_settings.readiness",
  tenantId,
  connectionStatus: connection?.status ?? "disconnected",
  productionReady: readiness.productionReady,
  degraded: false,
});
```

---

## 10. Definition of Done deste domínio

- merge conflict eliminado
- build verde
- `/api/admin/payments/settings` responde 200 autenticado
- `/api/admin/payments` responde 200 autenticado
- rows inválidas não derrubam mais o admin
- connections legadas são toleradas/normalizadas
- warning do ícone PWA some
- segredos operacionais expostos foram rotacionados e saneados
