# ANÁLISE COMPLETA - ESTRUTURA DO PAINEL ADMINISTRATIVO

## LOCALIZAÇÃO DAS PÁGINAS

### 1. Dashboard Principal (Main Admin)
Caminho: src/pages/admin/Dashboard.tsx
Rota: /admin/dashboard ou /t/:tenantSlug/admin/dashboard
Arquivo Principal: Dashboard.tsx (435 linhas)
Status: Componente principal do painel administrativo

### 2. Dashboard Financeiro (Payments)
Caminho: src/pages/admin/payments/DashboardPage.tsx
Rota: /admin/pagamentos ou /admin/financeiro
Arquivo Principal: DashboardPage.tsx (412 linhas)
Status: Página de analytics avançado de pagamentos

### 3. Página de Transações Financeiras
Caminho: src/pages/admin/payments/TransactionsPage.tsx
Rota: /admin/pagamentos/transacoes
Arquivo Principal: TransactionsPage.tsx (313 linhas)

### 4. Página de Configurações de Pagamento
Caminho: src/pages/admin/payments/SettingsPage.tsx
Rota: /admin/pagamentos/configuracoes
Arquivo Principal: SettingsPage.tsx (266 linhas)

---

## ESTRUTURA DO DASHBOARD PRINCIPAL

### 6 Cards de Métricas (linhas 111-133):

1. Receita Total
   - Ícone: DollarSign (verde - text-emerald-500)
   - Valor: R$ com 2 casas decimais
   - Baseado em: totalRevenue

2. Vendas Aprovadas
   - Ícone: ShoppingCart (azul - text-primary)
   - Valor: Quantidade de vendas
   - Baseado em: approvedPayments.length

3. Ticket Médio
   - Ícone: TrendingUp (âmbar - text-amber-500)
   - Valor: R$ com 2 casas decimais
   - Baseado em: totalRevenue / approvedPayments.length

4. Receitas Publicadas
   - Ícone: Eye (céu - text-sky-500)
   - Valor: Quantidade
   - Baseado em: recipes com status 'published'

5. Rascunhos
   - Ícone: FilePen (muted - text-muted-foreground)
   - Valor: Quantidade
   - Baseado em: recipes com status 'draft'

6. Total Pagamentos
   - Ícone: Users (violeta - text-violet-500)
   - Valor: Quantidade
   - Baseado em: payments.length

---

## BOTÕES IDENTIFICADOS NO DASHBOARD

### BOTÃO 1: RELATÓRIO FINANCEIRO ✅
Localização: Linha 415-422 no Dashboard.tsx
Ícone: DollarSign
Texto: "Relatório Financeiro"
Rota: /admin/pagamentos/transacoes
Variante: secondary
Classe: w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted
Destino: TransactionsPage.tsx
Status: ATIVO

Código:
Link to={buildTenantAdminPath('pagamentos/transacoes', tenantSlug)}>
  Button variant="secondary" className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
    DollarSign className="h-5 w-5" /> Relatório Financeiro
  /Button
/Link

### BOTÃO 2: AUDIÊNCIA ✅
Localização: Linha 423-430 no Dashboard.tsx
Ícone: Users
Texto: "Audiência"
Rota: /admin/newsletter
Variante: secondary
Classe: w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted
Destino: NewsletterPage (ainda não implementado)
Status: ESPERANDO ROTA NO ROUTER

Código:
Link to={buildTenantAdminPath('newsletter', tenantSlug)}>
  Button variant="secondary" className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
    Users className="h-5 w-5" /> Audiência
  /Button
/Link

### BOTÃO 3: CRIAR RECEITA ✅
Localização: Linha 402-406 no Dashboard.tsx
Ícone: PlusCircle
Texto: "Criar Receita"
Rota: /admin/receitas/nova
Variante: primary (default)
Status: ATIVO

### BOTÃO 4: GERENCIAR ITENS ✅
Localização: Linha 407-414 no Dashboard.tsx
Ícone: List
Texto: "Gerenciar Itens"
Rota: /admin/receitas
Variante: secondary
Status: ATIVO

---

## ESTRUTURA DA PÁGINA FINANCEIRA (DashboardPage.tsx)

Arquivo: src/pages/admin/payments/DashboardPage.tsx (412 linhas)

### 5 Abas Principais (Tabs):

1. Tendências - TrendsChart
   Gráfico de receita ao longo do tempo

2. Taxa de Sucesso - SuccessRateChart
   Taxa de aprovação por dia

3. Por Método - MethodsChart
   Distribuição por PIX, Cartão, Boleto

4. Mês a Mês - MonthlyChart
   Comparação mensal

5. Resumo Stripe - FinancialDashboard (TAB PADRÃO)
   Status e últimas transações

### KPICards (4 cards):
- Receita Total + Ticket Médio
- Taxa de Aprovação (%)
- Pendentes + Rejeitadas
- Reembolsos + Total

### FinancialDashboard (Aba "Resumo Stripe"):
- 3 Cards: Vendas Totais | Vendas Mês | Status Stripe
- Tabela: Últimas 5 vendas (Data | Comprador | Valor | Método | Status)

---

## COMPONENTES LAZY-LOADED

Dashboard.tsx:
- RevenueByDayChart (src/pages/admin/dashboard/RevenueByDayChart.tsx)
- PaymentMethodsChart (src/pages/admin/dashboard/PaymentMethodsChart.tsx)

DashboardPage.tsx:
- TrendsChart (src/pages/admin/payments/charts/TrendsChart.tsx)
- SuccessRateChart (src/pages/admin/payments/charts/SuccessRateChart.tsx)
- MethodsChart (src/pages/admin/payments/charts/MethodsChart.tsx)
- MonthlyChart (src/pages/admin/payments/charts/MonthlyChart.tsx)
- FinancialDashboard (src/pages/admin/payments/FinancialDashboard.tsx)
- KPICards (src/pages/admin/payments/KPICards.tsx)

---

## COMO MODIFICAR OS COMPONENTES

### 1. Adicionar Novo Card ao Dashboard Principal

Arquivo: src/pages/admin/Dashboard.tsx (linhas 111-133)

Adicione ao array stats:
{
  label: 'Seu Label',
  value: 'Seu Valor',
  icon: NovoIcone,  // Importar de lucide-react no topo
  color: 'text-sua-cor-500',  // Use classes Tailwind
}

### 2. Mudar Período Padrão

Arquivo: src/pages/admin/Dashboard.tsx (linha 42)

Padrão é '30'. Para mudar para '90':
const [period, setPeriod] = useState<Period>('90');

### 3. Modificar Quantidade de Receitas em Destaque

Arquivo: src/pages/admin/Dashboard.tsx (linha 177)

Padrão é 6. Para mostrar 10:
.slice(0, 10);

### 4. Adicionar Novo Botão

Arquivo: src/pages/admin/Dashboard.tsx (após linha 431)

<Link to={buildTenantAdminPath('sua-rota', tenantSlug)}>
  <Button
    variant="secondary"
    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
  >
    <SeuIcone className="h-5 w-5" /> Seu Texto
  </Button>
</Link>

### 5. Adicionar/Modificar KPI Cards Financeiro

Arquivo: src/pages/admin/payments/KPICards.tsx (linhas 17-42)

const cards = [
  {
    title: "Novo KPI",
    icon: NovoIcone,
    value: "Seu Valor",
    sub: "Subtítulo",
  },
];

### 6. Adicionar Novo Filtro de Transação

Arquivo: src/pages/admin/payments/TransactionsPage.tsx (linhas 33-48)

Para novo status:
const statusOptions = [
  // ... existentes
  { label: 'Novo Status', value: 'novo_status' },
];

Para novo método:
const methodOptions = [
  // ... existentes
  { label: 'Novo Método', value: 'novo_metodo' },
];

### 7. Modificar Labels

Arquivo: src/pages/admin/payments/constants.ts

export const STATUS_LABELS = {
  approved: 'Seu Label Novo',
};

export const METHOD_LABELS = {
  pix: 'Seu Label Novo',
};

---

## ROTEAMENTO COMPLETO

Arquivo: src/router.tsx

/admin/dashboard               → Dashboard.tsx (PRINCIPAL)
/admin/pagamentos              → DashboardPage.tsx
/admin/pagamentos/transacoes   → TransactionsPage.tsx
/admin/pagamentos/transacoes/:id → TransactionDetailsPage.tsx
/admin/pagamentos/configuracoes → SettingsPage.tsx (Stripe)
/admin/financeiro              → Alias para /admin/pagamentos
/admin/receitas                → RecipeListPage.tsx
/admin/receitas/nova           → RecipeEditor.tsx
/admin/receitas/:id/editar     → RecipeEditor.tsx
/admin/categorias              → CategoriesPage.tsx
/admin/configuracoes           → SettingsPage.tsx (Geral)
/admin/configuracoes/pagina-inicial → HomePageSettings.tsx
/admin/newsletter              → (AINDA NÃO EXISTE)

---

## ESTRUTURA DE DIRETÓRIOS

src/pages/admin/
├── Dashboard.tsx (435 linhas)
├── RecipeListPage.tsx
├── RecipeEditor.tsx
├── LoginPage.tsx
├── SettingsPage.tsx
├── HomePageSettings.tsx
├── dashboard/
│   ├── RevenueByDayChart.tsx
│   └── PaymentMethodsChart.tsx
├── payments/
│   ├── DashboardPage.tsx (412 linhas)
│   ├── TransactionsPage.tsx (313 linhas)
│   ├── TransactionDetailsPage.tsx
│   ├── FinancialDashboard.tsx (139 linhas)
│   ├── KPICards.tsx (60 linhas)
│   ├── SettingsPage.tsx (266 linhas)
│   ├── constants.ts (40 linhas)
│   ├── exportChart.ts
│   └── charts/
│       ├── TrendsChart.tsx
│       ├── SuccessRateChart.tsx
│       ├── MethodsChart.tsx
│       └── MonthlyChart.tsx
├── categories/
│   └── CategoriesPage.tsx

---

## RESUMO - BOTÕES ENCONTRADOS

| Botão | Ícone | Rota | Status |
|-------|-------|------|--------|
| Criar Receita | PlusCircle | /admin/receitas/nova | ATIVO |
| Gerenciar Itens | List | /admin/receitas | ATIVO |
| Relatório Financeiro | DollarSign | /admin/pagamentos/transacoes | ATIVO |
| Audiência | Users | /admin/newsletter | ESPERANDO IMPLEMENTAÇÃO |

---

## PRÓXIMOS PASSOS

Para implementar a página de Newsletter/Audiência:

1. Criar arquivo: src/pages/admin/NewsletterPage.tsx

2. Adicionar componentes:
   - Lista de subscribers
   - Botões de ação (exportar, segmentar)
   - Gráficos de engagement

3. Adicionar rota em src/router.tsx:
   { path: 'newsletter', lazy: lazyRoute(() => import('@/pages/admin/NewsletterPage')) }

4. Estrutura sugerida:
   - Cards: Total de subscribers, Ativos, Não ativos
   - Tabela com email, status, data de inscrição
   - Botões: Enviar email, Exportar, Segmentar
