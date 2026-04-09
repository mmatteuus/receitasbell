# PWA 10/10 — Últimos 3 Ajustes Finais

## Objetivo

Este arquivo existe para fechar os **3 últimos pontos mínimos** que ainda impedem chamar o PWA de **10/10 com convicção total**.

## Regra

- trabalhar direto na `main`
- não criar branch
- não reabrir refatoração grande
- não mexer no que já está estável sem motivo
- executar apenas o necessário para sair de **9.1/10** para **10/10**

---

## AJUSTE 1 — Atualizar o handoff final para refletir o estado real do código

### Problema atual

O arquivo `IMPLANTAR/PWA/PWA-10-10-FINAL-HANDOFF.md` ainda descreve gaps que o código **já resolveu**.

### Impacto

- documentação stale
- ruído para próximos agentes
- risco de retrabalho desnecessário

### O que fazer

Atualizar `IMPLANTAR/PWA/PWA-10-10-FINAL-HANDOFF.md` para refletir o estado atual real.

### Remover da seção de gaps pendentes

Remover como pendente tudo que já está fechado no código:

- home offline-aware
- favoritos PWA offline-aware
- lista de compras PWA offline-aware
- admin entry com `allowOffline: true`
- sessão offline user
- sessão offline admin
- sync center com conflito visível/resolúvel
- runtime offline no shell
- testes unitários offline já existentes

### Substituir por pendências reais

Deixar como pendente apenas:

1. revalidação final automática
2. homologação manual Android/iPhone/Desktop
3. captura de evidências finais

### Critério de aceite

- o handoff final fica coerente com o estado atual do repo
- nenhum gap já resolvido continua listado como aberto

---

## AJUSTE 2 — Provar o offline com E2E/homologação final, não só por arquitetura

### Problema atual

O código está muito forte, mas 10/10 exige **prova final**.

### O que fazer

Executar e registrar:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e -- --grep "PWA|offline"
```

### Além disso

Executar homologação manual real usando:

- `IMPLANTAR/PWA/PWA-10-10-CHECKLIST-HOMOLOGACAO.md`

### Plataformas obrigatórias

- Android Chrome
- iPhone Safari
- Desktop Chrome

### Fluxos obrigatórios

- instalação
- boot do app instalado
- home offline
- busca offline
- receita offline
- favoritos offline
- lista de compras offline
- compras/desbloqueios offline
- sync ao voltar rede
- admin offline seguro
- conflito e resolução

### Critério de aceite

- todos os checks automáticos passam
- todos os cenários críticos manuais passam
- evidências são coletadas

---

## AJUSTE 3 — Encerrar a governança final da pasta IMPLANTAR/PWA

### Problema atual

A pasta já está muito mais limpa, mas agora precisa ficar **final e coerente**.

### O que fazer

Ao terminar a homologação:

1. manter apenas os arquivos realmente finais
2. atualizar o conteúdo dos arquivos finais para o estado real
3. registrar explicitamente o status final do PWA

### Estrutura final desejada da pasta

Manter:

- `IMPLANTAR/PWA/PWA-OFFLINE-DOSSIE-COMPLETO.md`
- `IMPLANTAR/PWA/PWA-10-10-FINAL-HANDOFF.md`
- `IMPLANTAR/PWA/PWA-10-10-CHECKLIST-HOMOLOGACAO.md`
- `IMPLANTAR/PWA/PWA-10-10-ULTIMOS-3-AJUSTES.md`

### Opcional

Se preferir consolidar ainda mais, pode substituir estes 4 por **1 ou 2 arquivos finais**, desde que:

- nenhuma informação importante se perca
- o handoff continue executável
- a homologação continue rastreável

### Critério de aceite

- a pasta `IMPLANTAR/PWA` fica final, limpa e coerente
- qualquer próximo agente entende o estado do projeto sem precisar deduzir nada

---

## Definition of Done — 10/10 real

Só chamar de **10/10** quando os 3 ajustes acima estiverem concluídos.

### Isso significa:

- documentação final alinhada ao estado real do código
- validação automática executada com sucesso
- homologação manual executada com sucesso
- evidências coletadas
- pasta `IMPLANTAR/PWA` finalizada e coerente

---

## Entrega esperada do agente

Ao concluir, devolver:

1. arquivos alterados no código
2. arquivos alterados na pasta `IMPLANTAR/PWA`
3. logs de lint/typecheck/build/testes
4. evidências manuais
5. confirmação explícita de que o PWA chegou em **10/10**
