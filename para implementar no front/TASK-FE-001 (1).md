# TASK-FE-001: Padronizar CTA Instalar App

## Contexto
O produto já possui o componente base de instalação, mas o CTA ainda está com naming inconsistente e não está exposto nas superfícies corretas.

## FATO
- `InstallAppButton` já retorna `null` quando o app está instalado.
- o label atual é `Instalar app`.

## SUPOSIÇÃO
- o componente base continuará sendo a única fonte de verdade para renderização do CTA.

## Entregáveis
1. [ ] atualizar `src/pwa/components/InstallAppButton.tsx` para usar o label `Instalar App`
2. [ ] manter a regra de invisibilidade após instalação sem lógica paralela
3. [ ] revisar usos existentes para garantir consistência visual

## Critérios de aceite
- [ ] label padronizado para `Instalar App`
- [ ] botão some automaticamente após instalação
- [ ] nenhuma tela cria lógica duplicada para esconder o CTA
- [ ] TypeScript strict sem erros
- [ ] ESLint sem warnings
- [ ] build sem erros

## Dependências
- **Depende de:** nenhuma
- **Bloqueia:** TASK-FE-002, TASK-FE-003

## Validação
```bash
pnpm lint
pnpm typecheck
pnpm build
```
