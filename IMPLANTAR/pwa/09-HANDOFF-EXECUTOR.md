# Handoff final para o Agente Executor - PWA Online

## Regra de execucao
Voce nao pensa. Voce nao decide. Voce nao pesquisa. Voce executa exatamente o que esta nesta pasta.

## Ordem obrigatoria
1. Ler `README.md`
2. Ler `01-PRD-PWA-ONLINE.md`
3. Executar `02-ORDEM-DE-EXECUCAO.md`
4. Consultar `03-ARQUIVO-POR-ARQUIVO.md` durante cada alteracao
5. Aplicar `04-PADRAO-UI-MOBILE.md`
6. Respeitar `05-CONTRATOS-E-REGRAS.md`
7. Validar `06-FLUXO-DE-INSTALACAO.md`
8. Executar `07-PLANO-DE-TESTES.md`
9. Fechar com `08-CHECKLIST-DE-VALIDACAO.md`

## Comandos obrigatorios ao final
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`

## Instrucoes finais no imperativo
- Corrija o CTA para `Instalar aplicativo`.
- Remova o CTA de instalacao de `Header`, `AccountHome` e `AdminLayout`.
- Preserve a instalacao apenas em superficies PWA proprias.
- Nao implemente offline real nesta fase.
- Nao implemente sync offline.
- Nao implemente outbox.
- Nao implemente conflito offline.
- Refaça `PwaSearchPage` como tela PWA propria.
- Refaça `PwaRecipePage` como tela PWA propria.
- Ajuste `UserPwaShell` para experiencia online, sem comunicar offline pronto.
- Padronize altura, alinhamento e truncamento de todos os componentes do namespace PWA.
- Preserve `display: standalone`, `start_url: /pwa/entry` e `scope: /pwa/`, salvo impedimento tecnico real.
- Gere evidencia dos 3 fluxos criticos em viewport movel.
- So avance para offline apos receber `APROVADO ONLINE`.
