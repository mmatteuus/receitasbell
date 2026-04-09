# PWA 10/10 — Checklist Final de Homologação

## Objetivo

Provar em ambiente real que o PWA chegou em **10/10**, não apenas no código.

Este checklist existe para validar:

- instalação
- experiência de app
- offline real
- replay/sincronização
- conflito
- admin offline seguro
- ausência de regressão

## Regra de aprovação

Só chamar de **10/10** quando **todos os blocos obrigatórios** estiverem aprovados.

---

## 1. Validação automática

Executar exatamente:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e -- --grep "PWA|offline"
```

### Aprovação

- [ ] `lint` passou com exit 0
- [ ] `typecheck` passou com exit 0
- [ ] `build` passou sem erro
- [ ] `test:unit` passou
- [ ] suíte E2E PWA/offline passou

### Evidência obrigatória

- [ ] log completo do `lint`
- [ ] log completo do `typecheck`
- [ ] log completo do `build`
- [ ] log completo do `test:unit`
- [ ] log completo do `test:e2e`

---

## 2. Homologação manual — Android Chrome

## Instalação

- [ ] abrir `/pwa/login`
- [ ] validar CTA `Instalar aplicativo`
- [ ] instalar o app
- [ ] abrir o app instalado fora do navegador

## Boot

- [ ] abrir com internet
- [ ] confirmar entrada correta no shell PWA
- [ ] fechar e reabrir o app instalado
- [ ] confirmar que continua com aparência de app

## Offline real

- [ ] logar online
- [ ] acessar home, busca, uma receita, favoritos, compras e lista
- [ ] ativar modo avião
- [ ] reabrir o app instalado
- [ ] confirmar que a home abre com conteúdo útil offline
- [ ] confirmar que busca retorna resultados locais
- [ ] confirmar que receita previamente aberta carrega offline
- [ ] confirmar que favoritos abrem offline
- [ ] confirmar que lista de compras abre offline
- [ ] confirmar que compras/desbloqueios aparecem offline

## Mutações offline

- [ ] favoritar offline
- [ ] desfavoritar offline
- [ ] adicionar item manual na lista offline
- [ ] marcar item como concluído offline
- [ ] excluir item offline

## Retorno da rede

- [ ] desativar modo avião
- [ ] confirmar sync automático
- [ ] confirmar desaparecimento gradual das pendências
- [ ] confirmar persistência final no servidor

### Evidência obrigatória

- [ ] screenshot do CTA de instalação
- [ ] screenshot do app instalado
- [ ] screenshot da home offline
- [ ] screenshot da lista offline com pendência
- [ ] screenshot do Sync Center no Android

---

## 3. Homologação manual — iPhone Safari

## Instalação

- [ ] abrir superfície PWA
- [ ] validar hint iOS
- [ ] adicionar à tela inicial
- [ ] abrir o app instalado

## Experiência de app

- [ ] validar safe areas
- [ ] validar top bar
- [ ] validar bottom nav
- [ ] validar ausência de chrome com cara de site

## Offline

- [ ] repetir fluxo de login prévio online
- [ ] desligar rede
- [ ] reabrir o app instalado
- [ ] validar home offline
- [ ] validar receita offline
- [ ] validar favoritos offline
- [ ] validar lista offline
- [ ] validar sync quando a rede volta

### Evidência obrigatória

- [ ] screenshot do hint iOS
- [ ] screenshot do app instalado no iPhone
- [ ] screenshot da home offline no iPhone

---

## 4. Homologação manual — Desktop Chrome

## Instalação

- [ ] instalar pela barra/endereço ou menu
- [ ] abrir como app instalado

## Fluxos

- [ ] validar shell PWA
- [ ] validar update banner
- [ ] validar Sync Center
- [ ] validar fallback offline básico
- [ ] validar que não restou copy errada de instalação

### Evidência obrigatória

- [ ] screenshot do app instalado no desktop
- [ ] screenshot do Sync Center no desktop

---

## 5. Homologação manual — Admin offline seguro

## Fluxo

- [ ] logar como admin online
- [ ] abrir entry/admin shell
- [ ] abrir tela segura de leitura
- [ ] abrir rascunho de receita
- [ ] desligar rede
- [ ] confirmar acesso offline permitido só ao escopo seguro
- [ ] editar rascunho textual offline
- [ ] religar rede
- [ ] confirmar sincronização do rascunho
- [ ] validar comportamento de telas que **não** devem funcionar offline

### Evidência obrigatória

- [ ] screenshot do admin offline seguro
- [ ] screenshot do rascunho admin offline
- [ ] screenshot do estado após sincronização

---

## 6. Conflitos e Sync Center

## Fluxo de conflito

- [ ] gerar conflito controlado em ambiente de teste
- [ ] confirmar que o conflito aparece no Sync Center
- [ ] abrir diálogo de resolução
- [ ] resolver conflito
- [ ] disparar nova sincronização
- [ ] confirmar que o conflito some
- [ ] confirmar que o dado final ficou correto

### Evidência obrigatória

- [ ] screenshot do conflito no Sync Center
- [ ] screenshot do diálogo de resolução
- [ ] screenshot do estado final resolvido

---

## 7. UX / sensação de aplicativo

- [ ] nenhuma tela crítica fica em loading eterno sem rede
- [ ] nenhuma tela crítica mostra erro técnico desnecessário
- [ ] o usuário consegue continuar tarefa sem precisar pensar em “modo offline”
- [ ] pending changes aparece só quando necessário
- [ ] banner offline não polui a experiência
- [ ] app continua com sensação de aplicativo, não de site com remendo

---

## 8. Governança da pasta `IMPLANTAR/PWA`

- [ ] apenas os dossiês finais permaneceram
- [ ] arquivos superseded foram apagados
- [ ] `PWA-10-10-FINAL-HANDOFF.md` permanece
- [ ] `PWA-OFFLINE-DOSSIE-COMPLETO.md` permanece
- [ ] este checklist permanece

---

## 9. Go / No-Go

## Chamar de 10/10 só se tudo abaixo for verdadeiro

- [ ] automação passou
- [ ] Android passou
- [ ] iPhone passou
- [ ] Desktop passou
- [ ] user offline passou
- [ ] admin offline seguro passou
- [ ] sync e replay passaram
- [ ] conflito passou
- [ ] sem regressão visual/funcional
- [ ] pasta `IMPLANTAR/PWA` ficou limpa e organizada

## Se qualquer item falhar

Não chamar de **10/10**.

Registrar obrigatoriamente:

- cenário
- tela
- passo
- resultado esperado
- resultado atual
- evidência

---

## 10. Encerramento esperado

Ao concluir a homologação, devolver:

1. lista dos arquivos de código alterados
2. lista dos arquivos da pasta `IMPLANTAR/PWA` removidos
3. resumo do que foi concluído
4. logs dos comandos executados
5. evidências manuais
6. confirmação explícita de que o PWA chegou em **10/10**
