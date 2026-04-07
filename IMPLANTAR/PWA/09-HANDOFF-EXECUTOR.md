# Handoff final para o Agente Executor - PWA Online

## Regra de execucao
Voce nao pensa. Voce nao decide. Voce nao pesquisa. Voce executa exatamente o que esta nesta pasta.

## Ordem obrigatoria
1. Ler `README.md`
2. Ler `00-LEIA-PRIMEIRO-DCI-MESTRE.md`
3. Executar `10-DCI-DETALHADO-POR-ETAPA.md`
4. Aplicar `11-GUARDRAILS-E-NAO-REGRESSAO.md`
5. Validar por `12-ACEITE-POR-TELA.md`
6. Validar por `13-ACEITE-POR-ARQUIVO.md`
7. Fechar com `08-CHECKLIST-DE-VALIDACAO.md`

## Comandos obrigatorios ao final
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`

## Instrucoes finais no imperativo
- Corrija o CTA para `Instalar aplicativo`.
- Preserve o botao de instalacao ao lado do carrinho no header, porque houve instrucao explicita do usuario.
- Remova o CTA de instalacao de `AccountHome` e `AdminLayout`.
- Nao implemente offline real nesta fase.
- Refaça `PwaSearchPage` como tela PWA propria.
- Refaça `PwaRecipePage` como tela PWA propria.
- Ajuste `UserPwaShell` para experiencia online sem comunicar offline pronto.
- Padronize altura, alinhamento e truncamento de todos os componentes do namespace PWA.
- Preserve `display: standalone`, `start_url: /pwa/entry` e `scope: /pwa/`, salvo impedimento tecnico real.
- Gere evidencias dos 3 fluxos criticos em viewport movel.
