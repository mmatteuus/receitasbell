# Snapshot Lógico Baserow — 2026-03-29

Este arquivo contém o estado atual das tabelas críticas do Baserow antes de qualquer alteração estrutural ou de dados.

## 1. conexões_mercado_pago
A tabela contém 2 registros ativos que parecem ser duplicados ou drifts de inquilinos.

| ID | id_do_inquilino | mercado_pago_user_id | publicKey | status |
|----|-----------------|----------------------|-----------|--------|
| 34 | 34 | 8533405491426561 | APP_USR-3d28... | connected?* |
| 67 | receitabell | 8533405491426561 | APP_USR-3d28... | connected?* |

*\*Status inferido pela presença de tokens ativos.*

## 2. Ordens de pagamento (Payment_Orders)
- **Status:** 2 linhas vazias (apenas estrutura).

## 3. links mágicos (magic_links)
- **Status:** Tabela vazia.

## 4. Configurações (Settings)
Total de 12 registros. Destaques:
- **modo_de_pagamento:** sandbox
- **mp_client_id:** 8533405491426561
- **mp_client_secret:** [MASCARADO]
- **app_base_url:** https://receitasbell.mtsferreira.dev
- **upstash_redis_rest_url:** https://known-mollusk-39082.upstash.io

---
**Observação:** O registro ID 34 na tabela de conexões usa um ID numérico como inquilino, o que pode ser a causa de erros no admin se o sistema esperar um slug como "receitabell".
