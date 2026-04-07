# Coordenacao ChatGPT - Frontend Web

Status: ATIVO
Data: 2026-04-06

## Objetivo
Evitar trabalho duplicado entre Agentes A no frontend web.

## Escopo reservado pelo ChatGPT
- Validacao tecnica dos bugs reportados pelo usuario
- Consolidacao da causa raiz
- Orientacao de baixo risco para implementacao

## Nao duplicar
Se outro agente estiver mexendo em qualquer item abaixo, deve registrar lock e manter este arquivo atualizado.

### Bugs validados pelo ChatGPT
1. Conta sem botao de voltar e sem botao de sair da conta
2. Toggle de tema no dark com visibilidade quebrada
3. Menu mobile com 2 botoes X no canto superior direito
4. Categorias ainda renderizando letras em vez de icon/emoji
5. Imagens das receitas ainda quebradas

## Fato tecnico resumido
- `src/pages/AccountHome.tsx` nao possui botao explicito de voltar ao site nem fluxo explicito de logout do usuario autenticado.
- `src/lib/api/identity.ts` ja possui `logoutUser()` e deve ser priorizado em vez de somente limpar identidade local.
- `src/components/ui/dialog.tsx` injeta um botao `Close` padrao com `X`; drawers mobile que renderizam outro `X` manual causam duplicidade visual.
- `src/features/home/sections/HomeCategories.tsx` ainda usa `category.name.slice(0, 2).toUpperCase()`.
- O banco possui `public.categories.icon`, mas o tipo do frontend ainda nao usa esse campo.
- O frontend tenta renderizar imagem normalmente; o problema principal continua na URL entregue pelo payload publico.

## Regra operacional
- Pull obrigatorio antes de iniciar.
- Push obrigatorio ao fechar bloco estavel.
- Sem lock e sem log: nao iniciar.

## Handoff
Se outro agente assumir qualquer um desses itens, atualizar este arquivo e o log canonico do frontend.
