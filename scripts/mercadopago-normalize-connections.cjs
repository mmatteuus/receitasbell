#!/usr/bin/env node

/**
 * scripts/mercadopago-normalize-connections.cjs
 * 
 * TASK-003: Normalização de conexões Mercado Pago no Baserow.
 * Garante um registro 'connected' único por tenant e preenche campos faltantes.
 */

const { createCipheriv, createHash, randomBytes } = require("node:crypto");

// Configurações via ambiente
const BASEROW_API_URL = process.env.BASEROW_API_URL || "https://api.baserow.io";
const BASEROW_TOKEN = process.env.BASEROW_API_TOKEN;
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
const MP_CONNECTIONS_TABLE_ID = 897419;

const APPLY = process.argv.includes("--apply");

// Erros fatais iniciais
if (!BASEROW_TOKEN) throw new Error("BASEROW_API_TOKEN não fornecido.");
if (!ENCRYPTION_KEY_RAW) throw new Error("ENCRYPTION_KEY não fornecida (pode ser APP_COOKIE_SECRET).");

/**
 * Criptografia (compatível com src/server/shared/crypto.ts)
 */
function encryptSecret(value) {
  if (!value) return "";
  
  // No projeto, a chave é lida de base64 se tiver 44 chars, ou tratada de outra forma.
  // Replicando a lógica de crypto.ts: Buffer.from(raw, "base64")
  let key;
  try {
    key = Buffer.from(ENCRYPTION_KEY_RAW, "base64");
    // Se a chave não tiver 32 bytes após decode, talvez ela já devesse ser os 32 bytes?
    // Mas o crypto.ts é rígido: if (key.length !== 32) throw ...
    if (key.length !== 32) {
       // Tenta tratar como string pura se for compatível? Não, vamos seguir o erro do sistema se falhar.
    }
  } catch (e) {
    throw new Error("Falha ao processar ENCRYPTION_KEY como base64.");
  }
  
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

/**
 * Chamadas Baserow
 */
async function api(path, method = "GET", body = null) {
  const url = `${BASEROW_API_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Token ${BASEROW_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Baserow API Error (${response.status} em ${method} ${path}): ${errorBody}`);
  }

  return response.json();
}

async function listAllRows(tableId) {
  let rows = [];
  let next = `/api/database/rows/table/${tableId}/?user_field_names=true&size=200`;
  
  while (next) {
    const data = await api(next);
    rows = rows.concat(data.results);
    next = data.next ? data.next.replace(BASEROW_API_URL, "") : null;
  }
  return rows;
}

/**
 * Lógica de Normalização
 */
async function main() {
  console.log(`\n🚀 Iniciando TASK-003: Normalização de Conexões MP`);
  console.log(`Mode: ${APPLY ? "REAL RUN (APPLY)" : "DRY RUN"}\n`);

  const allRows = await listAllRows(MP_CONNECTIONS_TABLE_ID);
  console.log(`Total de registros encontrados: ${allRows.length}`);

  // Mapeamento de drifts conhecidos de inquilinos (ID numérico -> slug)
  const tenantMap = {
    "34": "receitabell",
    "receitasbell": "receitabell"
  };

  const tenants = {};

  for (const row of allRows) {
    let tenantId = String(row.tenant_id || "").trim();
    if (tenantMap[tenantId]) {
      console.log(`[MAP] Corrigindo mapeamento de inquilino: "${tenantId}" -> "${tenantMap[tenantId]}" (Row ${row.id})`);
      tenantId = tenantMap[tenantId];
    }

    if (!tenants[tenantId]) tenants[tenantId] = [];
    tenants[tenantId].push(row);
  }

  const summary = {
    total: allRows.length,
    corrected: 0,
    disconnected: 0,
    kept: 0,
    tenantsCount: Object.keys(tenants).length
  };

  const nowFull = new Date().toISOString();
  const now = nowFull.split("T")[0]; // YYYY-MM-DD

  for (const [tenantId, rows] of Object.entries(tenants)) {
    console.log(`\n--- Inquilino: ${tenantId} (${rows.length} rows) ---`);

    // Critério de escolha: Maior ID ou o que já está conectado
    rows.sort((a, b) => b.id - a.id);
    const mainRow = rows.find(r => r.status === "connected") || rows[0];
    
    for (const row of rows) {
      if (row.id === mainRow.id) {
        // Normalizar linha principal
        const patches = {};
        let needsUpdate = false;

        if (row.tenant_id !== tenantId) {
          patches.tenant_id = tenantId;
          needsUpdate = true;
        }

        if (row.status !== "connected") {
          patches.status = "connected";
          needsUpdate = true;
        }

        if (!row.access_token_encrypted && row.access_token) {
          console.log(`[ENCRYPT] Criptografando token para inquilino ${tenantId} (Row ${row.id})`);
          patches.access_token_encrypted = encryptSecret(row.access_token);
          needsUpdate = true;
        }

        if (!row.connected_at && !row.created_at) {
          patches.connected_at = now;
          needsUpdate = true;
        } else if (!row.connected_at && row.created_at) {
          patches.connected_at = row.created_at;
          needsUpdate = true;
        }
        
        patches.updated_at = now;

        if (needsUpdate) {
          console.log(`[VALID] Registro mantido e corrigido (Row ${row.id})`);
          if (APPLY) {
            await api(`/api/database/rows/table/${MP_CONNECTIONS_TABLE_ID}/${row.id}/?user_field_names=true`, "PATCH", patches);
          }
          summary.corrected++;
        } else {
          console.log(`[OK] Registro mantido sem alterações (Row ${row.id})`);
        }
        summary.kept++;
      } else {
        // Desconectar duplicatas
        if (row.status === "connected" || !row.status) {
          console.log(`[DISCONNECT] Desativando duplicata antiga (Row ${row.id})`);
          if (APPLY) {
            await api(`/api/database/rows/table/${MP_CONNECTIONS_TABLE_ID}/${row.id}/?user_field_names=true`, "PATCH", {
              status: "disconnected",
              disconnected_at: now,
              updated_at: now
            });
          }
          summary.disconnected++;
        } else {
          console.log(`[SKIP] Registro já estava desativado (Row ${row.id})`);
        }
      }
    }
  }

  console.log(`\n✅ Finalizado: ${summary.tenantsCount} tenants processados.`);
  console.log(`- Mantidos: ${summary.kept}`);
  console.log(`- Corrigidos: ${summary.corrected}`);
  console.log(`- Desconectados/Arquivados: ${summary.disconnected}`);
  
  if (!APPLY) {
    console.log(`\n⚠️  AVISO: Dry-run concluído. Use --apply para aplicar alterações.`);
  }
}

main().catch(err => {
  console.error(`\n❌ Falha na TASK-003:`, err.message);
  process.exit(1);
});
