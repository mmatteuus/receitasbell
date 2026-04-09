# MAPA VISUAL E REFERÊNCIA RÁPIDA

## 1️⃣ ESTRUTURA VISUAL - DASHBOARD PRINCIPAL (/admin/dashboard)

┌─────────────────────────────────────────────────────────────────────┐
│ DASHBOARD ADMINISTRATIVO                                             │
│ "Bem-vindo de volta! Aqui está o resumo do seu site."              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ FILTRO DE PERÍODO                         [7 dias] [30] [90]   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────┬───────────────┬───────────────┐
│  Receita      │   Vendas      │   Ticket      │
│  Total        │   Aprovadas   │   Médio       │
│  R\$ 10.000   │   50          │   R\$ 200     │
│  [DollarSign] │   [Cart]      │   [TrendUp]   │
└───────────────┴───────────────┴───────────────┘

┌───────────────┬───────────────┬───────────────┐
│ Receitas      │   Rascunhos   │ Total de      │
│ Publicadas    │               │ Pagamentos    │
│ 12            │   3           │   150         │
│ [Eye]         │   [FilePen]   │   [Users]     │
└───────────────┴───────────────┴───────────────┘

┌─────────────────────────────────────┬──────────────────────────────┐
│ RECEITA NO PERÍODO                  │ RECEITAS EM DESTAQUE         │
│                                     │ 1. Bolo de Chocolate         │
│ [GRÁFICO DE LINHAS]                 │    50 vendas · R\$ 5.000    │
│                                     │ 2. Pão de Queijo             │
│                                     │    45 vendas · R\$ 4.500    │
│                                     │ ...                          │
│                                     │ [Ver todas as receitas]      │
└─────────────────────────────────────┴──────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ FORMAS DE PAGAMENTO      │ STATUS DAS TRANSAÇÕES    │
│ [GRÁFICO PIZZA]          │ Aprovado    60%  ████    │
│                          │ Pendente    20%  ██      │
│                          │ Rejeitado   15%  █       │
│                          │ Cancelado    5%          │
│                          │                          │
│                          │ Potencial de Crescimento │
│                          │ Taxa de aprovação: 60%   │
└──────────────────────────┴──────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ [+] CRIAR        │ [≡] GERENCIAR    │ [\$] RELATÓRIO   │ [👥] AUDIÊNCIA   │
│ RECEITA          │ ITENS            │ FINANCEIRO       │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

---

## 2️⃣ ESTRUTURA VISUAL - DASHBOARD FINANCEIRO (/admin/pagamentos)

┌─────────────────────────────────────────────────────────────────────┐
│ ANALYTICS DE PAGAMENTOS                                              │
│                                    [Date Range Picker] 7d 30d 90d   │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬────────────────┬────────────────┐
│ RECEITA TOTAL  │ TAXA DE        │ PENDENTES      │ REEMBOLSOS     │
│ R\$ 50.000     │ APROVAÇÃO      │ 10 transações  │ 2 transações   │
│ Ticket: 200    │ 75%            │ Rejeitados: 5  │ Total: 180     │
└────────────────┴────────────────┴────────────────┴────────────────┘

[TAB BAR]
|Tendências|Taxa de Sucesso|Por Método|Mês a Mês|Resumo Stripe▼|

TAB: Resumo Stripe (Padrão)
┌────────────────┬────────────────┬────────────────┐
│ VENDAS TOTAIS  │ VENDAS ESTE    │ STATUS STRIPE  │
│ (APROVADAS)    │ MÊS            │                │
│ R\$ 50.000     │ R\$ 15.000     │ Ativo ✓        │
└────────────────┴────────────────┴────────────────┘

[TABELA: ÚLTIMAS VENDAS]
Data       │ Comprador        │ Valor      │ Método│ Status
2024-04-08 │ cliente@mail.com │ R\$ 150    │ PIX   │ Aprovado
2024-04-07 │ outro@mail.com   │ R\$ 200    │ Cartão│ Aprovado

---

## 3️⃣ ESTRUTURA VISUAL - TRANSAÇÕES (/admin/pagamentos/transacoes)

┌─────────────────────────────────────────────────────────────────────┐
│ TRANSAÇÕES                                                           │
│ "Acompanhe pagamentos, filtre por período..."                      │
└─────────────────────────────────────────────────────────────────────┘

[RESUMO RÁPIDO]
Total: 180 transações │ Valor Total: R\$ 50.000 │ Aprovado: R\$ 45.000

[FILTROS]
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐
│ Pesquisar       │ │ Status       │ │ Método       │ │ Período        │
│ Email / ID      │ │ Selecionado  │ │ Selecionado  │ │ [Date Range]   │
│ [Input]         │ │ [▼]          │ │ [▼]          │ │                │
└─────────────────┘ └──────────────┘ └──────────────┘ └────────────────┘

[BOTÕES]
[Filtrar] [Limpar Filtros] [CSV ↓] [PDF ↓]

[TABELA DINÂMICA]
ID  │ Data      │ Comprador  │ Valor   │ Status    │ Ações
001 │ 2024-04-08│ user@email │ R\$ 150 │ Aprovado  │ [Ver]
002 │ 2024-04-07│ user2@email│ R\$ 200 │ Pendente  │ [Ver]

---

## 4️⃣ ARQUIVO ESTRUTURA - ARQUIVOS IMPORTANTES

┌─ DASHBOARD PRINCIPAL
│  ├─ Dashboard.tsx (435 linhas)
│  │  ├─ State: period, recipes, payments, snapshotMode
│  │  ├─ Computed: stats array (6 cards)
│  │  ├─ Components:
│  │  │  ├─ RevenueByDayChart (lazy)
│  │  │  ├─ PaymentMethodsChart (lazy)
│  │  │  └─ 4 Botões de ação
│  │  └─ Grid: 3 cols (lg) / 2 cols (sm) / 1 col (mobile)
│  │
│  └─ dashboard/
│     ├─ RevenueByDayChart.tsx
│     └─ PaymentMethodsChart.tsx

┌─ DASHBOARD FINANCEIRO
│  ├─ DashboardPage.tsx (412 linhas)
│  │  ├─ State: payments, dateRange, stripeStatus
│  │  ├─ Computed: stats, revenueByDay, revenueByMethod
│  │  ├─ Tabs: 5 abas (Tendências, Taxa, Métodos, Mensal, Stripe)
│  │  └─ Componentes:
│  │     ├─ KPICards (4 cards)
│  │     ├─ TrendsChart (lazy)
│  │     ├─ SuccessRateChart (lazy)
│  │     ├─ MethodsChart (lazy)
│  │     ├─ MonthlyChart (lazy)
│  │     └─ FinancialDashboard (lazy)
│  │
│  ├─ KPICards.tsx (60 linhas)
│  │  └─ 4 Cards: Receita | Taxa | Pendentes | Reembolsos
│  │
│  ├─ FinancialDashboard.tsx (139 linhas)
│  │  ├─ 3 Cards Stripe
│  │  └─ Tabela com 5 transações recentes
│  │
│  ├─ TransactionsPage.tsx (313 linhas)
│  │  ├─ Filtros: Email, Status, Método, Período
│  │  ├─ Resumo: 3 cards (Total, Valor, Aprovado)
│  │  ├─ Tabela: PaymentsTable (lazy)
│  │  └─ Exportação: CSV, PDF
│  │
│  ├─ SettingsPage.tsx (266 linhas)
│  │  └─ Configuração Stripe Connect
│  │
│  ├─ constants.ts (40 linhas)
│  │  ├─ formatBRL()
│  │  ├─ COLORS (por status)
│  │  ├─ METHOD_LABELS
│  │  ├─ STATUS_LABELS
│  │  └─ STATUS_LABELS_REVERSE
│  │
│  └─ charts/
│     ├─ TrendsChart.tsx
│     ├─ SuccessRateChart.tsx
│     ├─ MethodsChart.tsx
│     └─ MonthlyChart.tsx

---

## 5️⃣ MAPA DE ROTEAMENTO

Dashboard (Principal)
    └─ /admin/dashboard
        ├─ Botão [Criar Receita] → /admin/receitas/nova
        ├─ Botão [Gerenciar] → /admin/receitas
        ├─ Botão [Relatório Financeiro] → /admin/pagamentos/transacoes
        └─ Botão [Audiência] → /admin/newsletter (não implementado)

Payments
    └─ /admin/pagamentos ou /admin/financeiro
        ├─ / (index) → DashboardPage.tsx
        ├─ /transacoes → TransactionsPage.tsx
        │   └─ /:id → TransactionDetailsPage.tsx
        └─ /configuracoes → SettingsPage.tsx

Receitas
    ├─ /admin/receitas → RecipeListPage.tsx
    ├─ /admin/receitas/nova → RecipeEditor.tsx
    └─ /admin/receitas/:id/editar → RecipeEditor.tsx

Categorias
    └─ /admin/categorias → CategoriesPage.tsx

Configurações
    ├─ /admin/configuracoes → SettingsPage.tsx
    └─ /admin/configuracoes/pagina-inicial → HomePageSettings.tsx

---

## 6️⃣ RESUMO DOS 4 BOTÕES PRINCIPAIS

┌──────────────────────────────────────────────────────────────────────┐
│ BOTÃO 1: CRIAR RECEITA                                               │
├──────────────────────────────────────────────────────────────────────┤
│ Ícone: PlusCircle                                                    │
│ Rota: /admin/receitas/nova                                          │
│ Variante: primary (azul, destaque)                                  │
│ Arquivo: Dashboard.tsx:402-406                                      │
│ Componente Destino: RecipeEditor.tsx                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ BOTÃO 2: GERENCIAR ITENS                                             │
├──────────────────────────────────────────────────────────────────────┤
│ Ícone: List                                                          │
│ Rota: /admin/receitas                                               │
│ Variante: secondary                                                 │
│ Arquivo: Dashboard.tsx:407-414                                      │
│ Componente Destino: RecipeListPage.tsx                              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ BOTÃO 3: RELATÓRIO FINANCEIRO ✅                                    │
├──────────────────────────────────────────────────────────────────────┤
│ Ícone: DollarSign                                                    │
│ Rota: /admin/pagamentos/transacoes                                  │
│ Variante: secondary                                                 │
│ Arquivo: Dashboard.tsx:415-422                                      │
│ Componente Destino: TransactionsPage.tsx                            │
│ Status: FUNCIONANDO CORRETAMENTE                                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ BOTÃO 4: AUDIÊNCIA ✅                                               │
├──────────────────────────────────────────────────────────────────────┤
│ Ícone: Users                                                         │
│ Rota: /admin/newsletter                                             │
│ Variante: secondary                                                 │
│ Arquivo: Dashboard.tsx:423-430                                      │
│ Componente Destino: NewsletterPage.tsx (AINDA NÃO EXISTE)          │
│ Status: ESPERANDO IMPLEMENTAÇÃO DA ROTA                             │
└──────────────────────────────────────────────────────────────────────┘

---

## 7️⃣ ÍCONES UTILIZADOS (lucide-react)

Importados no Dashboard.tsx:
├─ PlusCircle (Criar Receita)
├─ List (Gerenciar)
├─ Eye (Receitas Publicadas)
├─ FilePen (Rascunhos)
├─ DollarSign (Relatório Financeiro, Receita Total)
├─ TrendingUp (Ticket Médio, Badge +12%)
├─ Users (Audiência, Total Pagamentos)
└─ ShoppingCart (Vendas Aprovadas)

---

## 8️⃣ CLASSES TAILWIND UTILIZADAS

Buttons:
├─ w-full (largura 100%)
├─ h-14 (altura 56px)
├─ rounded-2xl (borda arredondada grande)
├─ gap-3 (espaço entre elementos)
├─ text-sm (tamanho de fonte pequeno)
├─ font-bold (fonte em negrito)
├─ border-muted (borda cor muted)
├─ shadow-lg (sombra grande)
└─ shadow-primary/20 (sombra com cor primária 20% opacidade)

Grid:
├─ lg:grid-cols-3 (3 colunas em desktop)
├─ sm:grid-cols-2 (2 colunas em tablet)
├─ grid-cols-1 (1 coluna por padrão)
├─ gap-6 (espaço entre itens)
├─ lg:col-span-2 (ocupa 2 colunas em desktop)
└─ md:grid-cols-2 (2 colunas em tela média)

Responsividade:
├─ lg: (1024px+)
├─ md: (768px+)
├─ sm: (640px+)
└─ (mobile: <640px)

---

## 9️⃣ CORES TAILWIND UTILIZADAS

Primárias:
├─ text-primary (cor tema padrão)
├─ text-emerald-500 (verde - Receita)
├─ text-amber-500 (âmbar - Ticket Médio)
├─ text-sky-500 (azul céu - Publicadas)
├─ text-violet-500 (violeta - Total)
└─ text-muted-foreground (cinza - Rascunhos)

Background:
├─ bg-card (fundo de card)
├─ bg-muted (cinza claro)
├─ bg-primary/5 (primária 5% opacidade)
└─ bg-green-50 (verde muito claro)

Borders:
├─ border (borda padrão)
├─ border-muted (cinza)
├─ border-primary/20 (primária 20%)
└─ rounded-3xl (muito arredondado)

---

## 🔟 TIPOS DE DADOS IMPORTANTES

Payment (Pagamento):
├─ id: string
├─ totalBRL: number
├─ status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
├─ paymentMethodKey: 'pix' | 'credit_card' | 'boleto' | 'pending'
├─ createdAt: string (ISO)
├─ approvedAt?: string (ISO)
├─ items: Array<{ slug, priceBRL }>
└─ payer: { email }

RecipeRecord (Receita):
├─ id: string
├─ slug: string
├─ title: string
├─ status: 'published' | 'draft'
└─ (+ mais campos)

Period (Período):
└─ '7' | '30' | '90' (dias)

---

## ❌ ERROS COMUNS

1. Adicionar botão mas esquecer de importar o ícone
   ❌ <SeuIcone /> sem import
   ✅ import { SeuIcone } from 'lucide-react';

2. Mudar layout sem considerar responsividade
   ❌ grid-cols-4 (quebra em mobile)
   ✅ lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1

3. Usar cor hardcoded em vez de constants
   ❌ color: '#10b981'
   ✅ color: COLORS[status]

4. Esquecer Suspense em componente lazy
   ❌ <RevenueChart data={data} />
   ✅ <Suspense fallback={...}><RevenueChart data={data} /></Suspense>

5. Modificar constants sem impacto global
   ✓ Sempre modificar em constants.ts
   ✗ Hardcoding em múltiplos arquivos

---
