# Contratos e regras - PWA Online

## 1. Contrato do CTA de instalacao
### Label unico permitido
`Instalar aplicativo`

### Placement permitido
- `/pwa/entry`
- `/pwa/login`
- futura superficie PWA propria de ajuda ou configuracoes, se existir

### Placement proibido
- `src/components/layout/Header.tsx`
- `src/pages/AccountHome.tsx`
- `src/components/layout/AdminLayout.tsx`
- qualquer card de perfil web fora de `/pwa/**`

### Regra de visibilidade
- mostrar somente quando o app nao estiver instalado
- em navegadores compativeis, usar `beforeinstallprompt`
- em iOS, mostrar instrucao manual, nunca simular prompt nativo inexistente

## 2. Contrato de ownership das rotas
- o namespace `/pwa/**` pertence ao PWA
- o namespace web publico pertence ao fluxo tradicional do site
- paginas PWA nao devem importar telas web inteiras como solucao final
- redirects de auth PWA devem retornar para destino PWA salvo

## 3. Contrato visual minimo
- campo: `48px` minimo
- botao: `48px` minimo
- item tocavel: `56px` minimo
- zero overflow horizontal
- truncamento obrigatorio quando texto ameaçar layout
- botoes irmaos com mesma altura

## 4. Contrato da shell PWA
Permitido nesta fase:
- top bar
- bottom nav
- auth redirect
- update banner
- safe-area

Proibido nesta fase:
- mensagem que sugere offline pronto
- sync offline
- conflito offline
- outbox
- modo aviao como requisito pronto

## 5. Contrato de service worker online
Permitido:
- assets estaticos
- update flow
- limpeza de caches antigos

Proibido:
- cache de dados de negocio para offline real
- paridade offline
- fila offline
- IndexedDB funcional como requisito de produto nesta fase

## 6. Contrato de evidencias
O executor deve entregar:
- diff dos arquivos alterados
- capturas em viewports moveis
- evidencia do manifesto e instalacao
- resultado de lint, typecheck, build, unit e Playwright
