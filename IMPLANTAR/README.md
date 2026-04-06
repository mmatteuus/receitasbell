# Receitas Bell - Ações Práticas

**Objetivo:** Arrumar o backend para funcionar em produção.

---

## 📄 Guias

1. **GUIA-PRATICO.md** ← **Comece aqui**
   - 7 correções urgentes com código pronto
   - Timeouts, rate limit, pooling, cursor pagination, SBOM
   - Checklist de validação
   - Deploy seguro

2. **DELEGACAO-AGENTES.md**
   - Se precisar delegar para múltiplos agentes
   - 8 especialistas com prompts de 3 linhas

---

## ⚡ Início Rápido

```bash
# Ler o guia
cat IMPLANTAR/GUIA-PRATICO.md

# Validar antes de deploy
npm run gate

# Deploy
vercel deploy --prod
```

---

**TOP 7 Prioridades:**
1. Validar multi-tenancy (RLS no Supabase)
2. Adicionar timeouts (10s Supabase/Stripe, 500ms Redis)
3. Validar rate limiting (100 req/min via Upstash)
4. Configurar connection pooling (usar Supabase Pooler)
5. Implementar cursor pagination (WHERE id > cursor)
6. Gerar SBOM no CI (cyclonedx-npm)
7. Fixar GitHub Actions por SHA

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
