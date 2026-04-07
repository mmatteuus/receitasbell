# Dossie PWA Online - Receitas Bell

Esta pasta e a fonte unica de verdade para a auditoria e execucao da fase PWA ONLINE.

## Regra central
- Esta fase cobre apenas PWA ONLINE.
- Nao implementar offline real nesta fase.
- Nao criar fluxo de sync offline, fila offline, conflito offline ou paridade modo aviao.
- O agente executor deve seguir a ordem exata definida aqui, sem pensar e sem reinterpretar.

## Ordem de leitura obrigatoria
1. `01-PRD-PWA-ONLINE.md`
2. `02-ORDEM-DE-EXECUCAO.md`
3. `03-ARQUIVO-POR-ARQUIVO.md`
4. `04-PADRAO-UI-MOBILE.md`
5. `05-CONTRATOS-E-REGRAS.md`
6. `06-FLUXO-DE-INSTALACAO.md`
7. `07-PLANO-DE-TESTES.md`
8. `08-CHECKLIST-DE-VALIDACAO.md`
9. `09-HANDOFF-EXECUTOR.md`

## Regra do CTA de instalacao
Todo CTA, botao, card ou acao de instalacao deve usar exatamente:

`Instalar aplicativo`

## Meta desta fase
Fazer o PWA parecer aplicativo instalado em dispositivos moveis, sem cara de site, com consistencia visual, navegacao de app e instalacao controlada.
