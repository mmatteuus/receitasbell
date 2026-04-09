# Checklist de Validação — PWA Online

## 1. Build e qualidade

- [ ] `npm run lint` passou
- [ ] `npm run typecheck` passou
- [ ] `npm run build` passou
- [ ] `npm run test:unit` passou
- [ ] suíte PWA do Playwright passou

## 2. Manifest e instalação

- [ ] `manifest.webmanifest` continua sendo servido
- [ ] `start_url` final é `/pwa/entry`
- [ ] `display` continua `standalone`
- [ ] `scope` continua `/`
- [ ] ícones atuais continuam válidos

## 3. HTML mobile-first

- [ ] `viewport-fit=cover` existe no `index.html`
- [ ] `theme-color` do HTML está alinhado ao manifest
- [ ] metas iOS web app existem

## 4. CTA de instalação

- [ ] todo CTA visível usa exatamente `Instalar aplicativo`
- [ ] nenhum CTA funcional usa `Instalar App`
- [ ] `aria-label` está coerente
- [ ] título do CTA está coerente

## 5. Service worker online

- [ ] `runtimeCaching` de `https://api.*` foi removido
- [ ] cache de assets estáticos continua funcionando
- [ ] update flow continua funcionando

## 6. iOS hint

- [ ] hint iOS não promete offline
- [ ] hint iOS não promete notificações
- [ ] hint iOS orienta instalação manual com clareza

## 7. Fluxos críticos

### Fluxo A — abertura do app

- [ ] instalar PWA no Android
- [ ] abrir app instalado
- [ ] bootstrap cair em `/pwa/entry`
- [ ] usuário não autenticado cair em `/pwa/login`

### Fluxo B — login do usuário

- [ ] login por senha continua funcionando
- [ ] login Google continua funcionando
- [ ] redirect pós-login continua funcionando

### Fluxo C — navegação interna

- [ ] top bar renderiza
- [ ] bottom nav renderiza
- [ ] favoritos funciona
- [ ] lista funciona
- [ ] compras funciona
- [ ] busca funciona

## 8. Multi-tenant

- [ ] `/t/:tenantSlug/pwa/entry` continua funcional
- [ ] `/t/:tenantSlug/pwa/login` continua funcional
- [ ] instalação não piorou o bootstrap tenant-aware

## 9. Regressão visual

- [ ] nenhuma tela pública web que já funciona foi quebrada
- [ ] nenhuma rota admin web foi alterada sem necessidade
- [ ] header público continua funcional
