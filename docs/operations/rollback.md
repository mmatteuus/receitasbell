# Procedimentos de Rollback

Em caso de falha crítica detectada após um deploy em produção, siga estes passos para restaurar a estabilidade do sistema.

## 1. Identificação da Falha
- Alertas no Sentry (erros 5xx constantes).
- Health Check retornando `unhealthy` ou `503`.
- Reclamações de usuários sobre falhas no checkout ou login.

## 2. Rollback via Vercel Dashboard
1. Acesse o projeto na [Vercel](https://vercel.com).
2. Vá para a aba **Deployments**.
3. Localize o último deployment estável conhecido.
4. Clique nos três pontos (...) e selecione **Promote to Production**.
5. O redirecionamento de tráfego será instantâneo para a versão estável anterior.

## 3. Rollback via CLI
Se tiver a Vercel CLI configurada:
```bash
vercel rollback <deployment-id-da-versao-estavel>
```

## 4. Ações Corretivas
- Após o rollback, isole a causa raiz em ambiente de desenvolvimento/preview.
- Não tente "corrigir para frente" (fix forward) se a correção demorar mais de 10 minutos para ser implementada e validada.
- Documente o incidente no post-mortem se a indisponibilidade afetar usuários.
