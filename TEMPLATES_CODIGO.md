# TEMPLATES DE CÓDIGO - PRONTO PARA USAR

## 🎨 TEMPLATE 1: Adicionar Novo Card ao Dashboard

// Local: src/pages/admin/Dashboard.tsx (linhas 111-133)

// 1. Adicione esta entrada ao array stats:
{
  label: 'Meu Novo Card',
  value: minhaVariavel,
  icon: MeuIcone,
  color: 'text-meu-cor-500',
}

// 2. Se usar ícone novo, importe no topo:
import { MeuIcone } from 'lucide-react';

// EXEMPLO COMPLETO:
{
  label: 'Crescimento Mensal',
  value: '+15%',
  icon: ArrowUpRight,
  color: 'text-green-500',
}

---

## 🎯 TEMPLATE 2: Adicionar Novo Botão

// Local: src/pages/admin/Dashboard.tsx (após linha 431)

<Link to={buildTenantAdminPath('sua-rota-aqui', tenantSlug)}>
  <Button
    variant="secondary"
    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
  >
    <SeuIcone className="h-5 w-5" /> Seu Texto
  </Button>
</Link>

// EXEMPLOS:

// Exemplo 1: Botão com rota simples
<Link to={buildTenantAdminPath('relatorios', tenantSlug)}>
  <Button
    variant="secondary"
    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
  >
    <BarChart3 className="h-5 w-5" /> Relatórios
  </Button>
</Link>

// Exemplo 2: Botão com variant primary (destaque)
<Link to={buildTenantAdminPath('meu-modulo', tenantSlug)}>
  <Button className="w-full h-14 rounded-2xl gap-3 text-sm font-bold shadow-lg shadow-primary/20">
    <Zap className="h-5 w-5" /> Novo Recurso
  </Button>
</Link>

// Exemplo 3: Botão com rota dinâmica
<Link to={buildTenantAdminPath(\eceitas/\/analytics\, tenantSlug)}>
  <Button
    variant="secondary"
    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
  >
    <TrendingUp className="h-5 w-5" /> Ver Analytics
  </Button>
</Link>

---

## 📊 TEMPLATE 3: Adicionar Novo KPI Card

// Local: src/pages/admin/payments/KPICards.tsx (linhas 17-42)

{
  title: "Seu KPI",
  icon: SeuIcone,
  value: "Seu Valor",
  sub: "Subtítulo",
}

// EXEMPLOS COM DADOS REAIS:

{
  title: "Faturamento Anual",
  icon: Wallet,
  value: formatBRL(stats.totalRevenue * 12),  // Estimativa anual
  sub: "Projeção baseada no ticket médio",
}

{
  title: "Taxa de Rejeição",
  icon: AlertCircle,
  value: \\%\,
  sub: "Transações rejeitadas",
}

{
  title: "Conversão Mensal",
  icon: Percent,
  value: \\%\,
  sub: \Dos \ pagamentos\,
}

---

## 🔍 TEMPLATE 4: Adicionar Novo Filtro

// Local: src/pages/admin/payments/TransactionsPage.tsx (linhas 33-48)

// Para adicionar novo STATUS:
const statusOptions: { label: string; value: PaymentStatus }[] = [
  { label: 'Aprovado', value: 'approved' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Processando', value: 'in_process' },
  { label: 'Rejeitado', value: 'rejected' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Devolvido', value: 'refunded' },
  { label: 'Chargeback', value: 'charged_back' },
  // NOVO:
  { label: 'Seu Status', value: 'seu_status' },
];

// Para adicionar novo MÉTODO:
const methodOptions = [
  { label: 'PIX', value: 'pix' },
  { label: 'Cartão de Crédito', value: 'credit_card' },
  { label: 'Boleto', value: 'boleto' },
  { label: 'A definir', value: 'pending' },
  // NOVO:
  { label: 'Seu Método', value: 'seu_metodo' },
];

---

## 🏷️ TEMPLATE 5: Modificar Labels

// Local: src/pages/admin/payments/constants.ts

// ANTES:
export const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
};

// DEPOIS:
export const STATUS_LABELS: Record<string, string> = {
  approved: 'Confirmado',  // Modificado
};

// OUTRO EXEMPLO - Método:
export const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
  pending: 'A definir',
  // NOVO:
  wallet: 'Carteira Digital',
};

---

## 🎨 TEMPLATE 6: Modificar Cores de Status

// Local: src/pages/admin/payments/constants.ts

export const COLORS: Record<string, string> = {
  approved: 'hsl(142, 71%, 45%)',      // Verde (ANTES)
  // MUDAR PARA:
  approved: 'hsl(199, 89%, 48%)',      // Azul (DEPOIS)
};

// REFERÊNCIA DE CORES (HSL):
// Verde: hsl(142, 71%, 45%)
// Azul: hsl(199, 89%, 48%)
// Vermelho: hsl(0, 84%, 60%)
// Amarelo: hsl(45, 93%, 47%)
// Violeta: hsl(262, 83%, 58%)
// Cinza: hsl(0, 0%, 60%)

---

## 📄 TEMPLATE 7: Criar Nova Página Admin

// Local: src/pages/admin/MinhaNovaPage.tsx

import { PageHead } from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MinhaNovaPage() {
  return (
    <>
      <PageHead
        title="Minha Página"
        description="Descrição para SEO"
        noindex={true}
      />
      
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold">Meu Título</h1>
          <p className="text-muted-foreground mt-2">Minha descrição</p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>Conteúdo aqui</CardContent>
          </Card>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <Button>Ação Primária</Button>
          <Button variant="outline">Ação Secundária</Button>
        </div>
      </div>
    </>
  );
}

---

## 🔀 TEMPLATE 8: Adicionar Rota

// Local: src/router.tsx (function buildAdminChildren)

// ANTES:
function buildAdminChildren() {
  return [
    { index: true, element: <TenantAdminNavigate to="dashboard" /> },
    { path: 'dashboard', lazy: lazyRoute(() => import('@/pages/admin/Dashboard')) },
    // ... mais rotas
  ];
}

// DEPOIS:
function buildAdminChildren() {
  return [
    { index: true, element: <TenantAdminNavigate to="dashboard" /> },
    { path: 'dashboard', lazy: lazyRoute(() => import('@/pages/admin/Dashboard')) },
    // NOVA ROTA:
    { path: 'minha-pagina', lazy: lazyRoute(() => import('@/pages/admin/MinhaNovaPage')) },
    // ... mais rotas
  ];
}

// ACESSAR EM: /admin/minha-pagina

---

## 🎪 TEMPLATE 9: Adicionar Nova Aba

// Local: src/pages/admin/payments/DashboardPage.tsx (linhas 357-402)

// ADICIONE o trigger:
<TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
  <TabsTrigger value="trends">Tendências</TabsTrigger>
  <TabsTrigger value="success">Taxa de Sucesso</TabsTrigger>
  <TabsTrigger value="methods">Por Método</TabsTrigger>
  <TabsTrigger value="monthly">Mês a Mês</TabsTrigger>
  <TabsTrigger value="stripe">Resumo Stripe</TabsTrigger>
  {/* NOVO: */}
  <TabsTrigger value="minha-aba">Minha Aba</TabsTrigger>
</TabsList>

// ADICIONE o conteúdo:
<TabsContent value="minha-aba" className="animate-fade-in">
  <Suspense fallback={<AnalyticsPanelFallback label="minha aba" />}>
    <MeuComponente data={dados} />
  </Suspense>
</TabsContent>

---

## 🔗 TEMPLATE 10: Link com buildTenantAdminPath

// Padrão geral:
<Link to={buildTenantAdminPath('sua-rota', tenantSlug)}>

// EXEMPLOS:

// Simples:
to={buildTenantAdminPath('dashboard', tenantSlug)}

// Com parâmetro:
to={buildTenantAdminPath('receitas/123/editar', tenantSlug)}

// Com função ternária:
to={buildTenantAdminPath(
  editando ? \eceitas/\/editar\ : 'receitas/nova',
  tenantSlug
)}

// Aninhado (caminhos compostos):
to={buildTenantAdminPath('pagamentos/transacoes', tenantSlug)}

---

## 💾 TEMPLATE 11: Estado React - useState

// Simples:
const [period, setPeriod] = useState<Period>('30');

// Objeto:
const [form, setForm] = useState({
  payment_mode: 'sandbox',
  webhooks_enabled: true,
  payment_topic_enabled: true,
});

// Array:
const [recipes, setRecipes] = useState<RecipeRecord[]>([]);

// Com tipo condicional:
const [dateRange, setDateRange] = useState<DateRange | undefined>();

// Com valor inicial vindo de hook:
const [payments, setPayments] = useState<Payment[]>(() => {
  const initial = searchParams.get('status');
  return initial ? JSON.parse(initial) : [];
});

---

## ⚡ TEMPLATE 12: useMemo para Performance

// Simples:
const published = recipes.filter((recipe) => recipe.status === 'published').length;

// Com useMemo:
const published = useMemo(() => {
  return recipes.filter((recipe) => recipe.status === 'published').length;
}, [recipes]);

// Com múltiplas linhas:
const stats = useMemo(() => {
  const totalRevenue = payments.reduce(
    (acc, p) => (p.status === 'approved' ? acc + p.totalBRL : acc),
    0
  );
  const total = payments.length;
  const approved = payments.filter((p) => p.status === 'approved').length;
  
  return { totalRevenue, total, approved };
}, [payments]);

---

## 🎯 TEMPLATE 13: Grid Responsivo

// PADRÃO 1: Card simples
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Card>...</Card>
</div>

// PADRÃO 2: Com col-span
<div className="grid gap-8 lg:grid-cols-3">
  <div className="lg:col-span-2">Seção grande</div>
  <div>Seção pequena</div>
</div>

// PADRÃO 3: Botões
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <Button>...</Button>
</div>

// BREAKPOINTS:
// lg: 1024px+
// md: 768px+
// sm: 640px+
// (default): <640px

---

## 🌈 TEMPLATE 14: Cores e Estilos

// CLASSES COMUNS:

// Texto:
className="text-primary"                  // Cor tema
className="text-2xl font-bold"           // Tamanho + peso
className="text-muted-foreground"        // Cinza
className="text-sm text-muted-foreground" // Pequeno + cinza

// Background:
className="bg-card"          // Fundo branco/escuro do tema
className="bg-muted"         // Cinza claro
className="bg-primary/5"     // 5% opacidade da cor tema
className="bg-green-50"      // Verde muito claro

// Borda:
className="border"           // Borda simples
className="rounded-2xl"      // Arredondamento grande
className="rounded-3xl"      // Arredondamento maior
className="border-muted"     // Borda cinza

// Sombra:
className="shadow-sm"        // Sombra pequena
className="shadow-md"        // Sombra média
className="shadow-lg shadow-primary/20" // Sombra com cor

---

## 📱 TEMPLATE 15: Componente Responsivo Completo

<div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
  {/* Desktop: 3 cols | Tablet: 2 cols | Mobile: 1 col */}
  
  <Card className="rounded-3xl border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">Meu Card</h2>
      <MeuIcone className="h-5 w-5 text-primary" />
    </div>
    <p className="text-2xl font-bold">Valor</p>
    <p className="text-sm text-muted-foreground mt-1">Subtítulo</p>
  </Card>
</div>

---

## 🔧 TEMPLATE 16: Import Padrão

// Componentes UI:
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Ícones:
import { DollarSign, Users, TrendingUp } from 'lucide-react';

// Hooks:
import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

// Tipos e Utils:
import type { Payment } from '@/lib/payments/types';
import { formatBRL, COLORS } from './constants';
import { buildTenantAdminPath } from '@/lib/tenant';

// SEO:
import { PageHead } from '@/components/PageHead';

---
