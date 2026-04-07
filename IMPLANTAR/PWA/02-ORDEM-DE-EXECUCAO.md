# Ordem de execucao - PWA Online

## Regra geral
Executar uma etapa por vez. Nao pular. Nao reinterpretar. Nao misturar online com offline.

## Etapa 01 - Corrigir o CTA de instalacao
- trocar `Instalar App` por `Instalar aplicativo`
- manter a logica atual de `beforeinstallprompt`
- manter compatibilidade com iOS por instrucao externa

## Etapa 02 - Remover vazamentos de instalacao
- remover `InstallAppButton` dos contextos web proibidos, exceto quando houver instrucao mais recente do usuario
- preservar conta, admin e header sem quebrar funcao existente

## Etapa 03 - Limpar a shell PWA da fase online
- remover ou neutralizar sinais de offline pronto
- preservar update banner, auth redirect, top bar, bottom nav e safe-area

## Etapa 04 - Padronizar UI mobile do namespace PWA
- campos com no minimo `48px`
- botoes com no minimo `48px`
- itens tocaveis com no minimo `56px`
- truncamento e clamp para textos longos
- zero overflow horizontal

## Etapa 05 - Reescrever `PwaSearchPage`
- remover import de `@/pages/Search`
- criar tela propria mobile-first

## Etapa 06 - Reescrever `PwaRecipePage`
- remover import de `@/pages/RecipePage`
- criar tela propria mobile-first

## Etapa 07 - Refinar chrome de app
- revisar `PwaTopBar`
- revisar `PwaBottomNav`
- revisar `PwaEntryPage`
- reforcar sensacao de aplicativo instalado

## Etapa 08 - Validar manifesto, icones e update flow
- preservar `display: standalone`
- preservar `start_url: /pwa/entry`
- preservar `scope: /pwa/`
- validar instalacao Android e instrucao iOS

## Etapa 09 - Ampliar testes
- validar CTA exato
- validar viewports 360, 390 e 430
- validar 3 fluxos criticos

## Etapa 10 - Fechar aceite
- executar checklist final
- anexar evidencias
- confirmar que nada de offline real foi implementado
