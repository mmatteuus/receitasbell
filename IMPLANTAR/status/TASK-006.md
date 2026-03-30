# TASK-006 — Validar ícones do PWA e build
- **Objetivo:** garantir que o manifest use PNG válidos e que saiam no build final.
- **Arquivos-alvo:** `public/pwa/icons/*`, `vite.config.ts`, `dist/pwa/icons`.
- **Passos**
  1. Confirmar existência dos quatro arquivos (`icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`) em `public/pwa/icons`.
  2. Verificar dimensões/formato com `file` ou `identify`.
  3. Rodar `npm run build` e confirmar presença em `dist/pwa/icons`.
  4. Usar `curl -I https://<deployment>/pwa/icons/...` (ou `serve dist`) para checar `Content-Type: image/png`.
  5. Se algum PNG inválido, substitua por gerar novo (mantendo os nomes).
- **Outputs esperados**
  - Logs da verificação dos arquivos e do build.
  - Lista de URLs validadas com `Content-Type`.
  - Observações sobre qualquer re-geração necessária.
- **Após concluir:** atualizar `execution-log.md` e deletar este arquivo.
