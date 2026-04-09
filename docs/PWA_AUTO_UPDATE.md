# PWA Auto-Update System

Este documento descreve como o sistema de atualização automática do PWA funciona.

## Como Funciona

O PWA agora possui um sistema robusto de atualização automática que permite que os usuários recebam atualizações sem precisar desinstalar e reinstalar a aplicação.

### Fluxo de Atualização

1. **Detecção de Atualização**: O Service Worker verifica continuamente se há novas versões da aplicação (a cada minuto)
2. **Download Automático**: Quando uma atualização está disponível, é baixada automaticamente em segundo plano
3. **Notificação ao Usuário**: Uma notificação é exibida informando que há uma atualização disponível
4. **Atualização sob Demanda**: O usuário pode escolher entre:
   - **Atualizar Agora**: A aplicação recarrega imediatamente com a nova versão
   - **Agora Não**: Continua usando a versão atual (será avisado novamente depois)

### Arquivos Relacionados

- **`src/hooks/useServiceWorkerUpdate.ts`**: Hook React que monitora o Service Worker
- **`src/components/PWAUpdateHandler.tsx`**: Componente que exibe a notificação de atualização
- **`src/main.tsx`**: Integração do PWAUpdateHandler na aplicação

### Configuração do Vite PWA

As seguintes configurações foram otimizadas no `vite.config.ts`:

```typescript
workbox: {
  cleanupOutdatedCaches: true,      // Limpar caches antigos
  skipWaiting: true,                 // SW novo pula a fase de waiting
  clientsClaim: true,                // SW novo assume controle dos clientes
}
```

## Comportamento Esperado

### Cenários de Atualização

1. **Ícones alterados (como no caso do emoji do chapéu)**:
   - Atualização é baixada automaticamente
   - Usuário recebe notificação
   - Ao clicar em "Atualizar agora", vê o novo ícone imediatamente

2. **Código alterado**:
   - Novo JavaScript/CSS é cacheado
   - Service Worker detecta mudanças
   - Notificação é exibida
   - Usuário pode atualizar sem afetar sua sessão

3. **Assets estáticos (imagens, fontes)**:
   - Também são atualizados automaticamente
   - Usuário nunca vê assets antigos após atualização

## Testes

Para testar o sistema de atualização:

1. Abra a aplicação no navegador
2. Faça uma alteração (ex: mude uma cor, ícone, etc.)
3. Execute `npm run build`
4. Deploy da nova versão
5. Abra a aplicação em outra aba
6. Volta para a aba anterior
7. Você deve ver uma notificação de atualização disponível
8. Clique em "Atualizar agora"
9. A aplicação recarrega com a nova versão

## Frequência de Verificação

- O Service Worker verifica por atualizações a cada **1 minuto**
- Você pode ajustar isso editando o intervalo em `useServiceWorkerUpdate.ts`

```typescript
const interval = setInterval(() => {
  swRegistration?.update();
}, 60 * 1000); // 60 segundos
```

## Benefícios

✅ **Sem necessidade de desinstalação**: Usuários não precisam apagar e reinstalar a app
✅ **Atualização automática**: Novos assets são baixados em segundo plano
✅ **Controle do usuário**: O usuário decide quando atualizar
✅ **Sem perda de dados**: A sessão é mantida até o usuário clicar em atualizar
✅ **Notificação clara**: Mensagem descritiva sobre o que está acontecendo

## Troubleshooting

Se as atualizações não estão funcionando:

1. Abra o DevTools (F12)
2. Vá para a aba **Application**
3. Procure por **Service Workers**
4. Verifique se o SW está **activated and running**
5. Tente **Unregister** e recarregue a página

No Chrome DevTools, você pode:

- Simular modo offline
- Forçar atualização do Service Worker
- Ver o cache da aplicação
