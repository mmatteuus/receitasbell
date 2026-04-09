# GUIA PRÁTICO - COMO MODIFICAR O PAINEL ADMINISTRATIVO

## MAPA RÁPIDO DE MODIFICAÇÕES

### 📍 Modificar Cards do Dashboard Principal
Arquivo: src/pages/admin/Dashboard.tsx
Linhas: 111-133
Objetivo: Adicionar, remover ou editar os 6 cards de métricas

Passo 1: Localize o array stats:
const stats = [
  {
    label: 'Receita Total',
    value: \R\$ \\,
    icon: DollarSign,
    color: 'text-emerald-500',
  },
  // ... mais 5 cards
];

Passo 2: Para ADICIONAR novo card:
{
  label: 'Meu Card',
  value: 'Meu Valor',  // Pode ser string ou variável
  icon: MeuIcone,      // Importar em lucide-react
  color: 'text-cor-500', // Use classes Tailwind: red, blue, green, etc
}

Passo 3: Para MODIFICAR cores:
Cores disponíveis:
- text-emerald-500 (verde)
- text-primary (cor tema)
- text-amber-500 (amarelo/âmbar)
- text-sky-500 (azul céu)
- text-muted-foreground (cinza)
- text-violet-500 (violeta)
- text-red-500, text-blue-500, etc

Passo 4: Para MODIFICAR ícones:
Ícones já importados:
- PlusCircle, List, Eye, FilePen, DollarSign, TrendingUp, Users, ShoppingCart

Para usar outro:
1. Importe no topo:
   import { NovoIcone } from 'lucide-react';
2. Use no array:
   icon: NovoIcone,

---

### 📍 Modificar Período Padrão (7, 30, 90 dias)
Arquivo: src/pages/admin/Dashboard.tsx
Linha: 42

Atual:
const [period, setPeriod] = useState<Period>('30');

Para mudar padrão para 90 dias:
const [period, setPeriod] = useState<Period>('90');

---

### 📍 Modificar Quantidade de Receitas em Destaque
Arquivo: src/pages/admin/Dashboard.tsx
Linha: 177

Atual (mostra 6):
.slice(0, 6);

Para mostrar 10:
.slice(0, 10);

Para mostrar 3:
.slice(0, 3);

---

### 📍 Adicionar Novo Botão ao Dashboard
Arquivo: src/pages/admin/Dashboard.tsx
Após linha 431 (dentro do grid de 4 botões)

Template pronto:
<Link to={buildTenantAdminPath('sua-rota', tenantSlug)}>
  <Button
    variant="secondary"
    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
  >
    <SeuIcone className="h-5 w-5" /> Seu Texto
  </Button>
</Link>

Variantes de Button:
- variant="default" (azul/primária - destaque)
- variant="secondary" (cinza - normal)
- variant="outline" (com borda)
- variant="ghost" (transparente)

Exemplo prático - Botão de Analytics:
<Link to={buildTenantAdminPath('analytics', tenantSlug)}>
  <Button
    variant="secondary"
    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold border-muted"
  >
    <BarChart3 className="h-5 w-5" /> Analytics
  </Button>
</Link>

---

### 📍 Modificar Cores dos Gráficos
Arquivo: src/pages/admin/Dashboard.tsx
Linhas: 207-214

Atual:
const pieColors = [
  'hsl(var(--primary))',      // Cor primária do tema
  '#10b981',                   // Emerald-500
  '#f59e0b',                   // Amber-500
  '#3b82f6',                   // Blue-500
  '#8b5cf6',                   // Violet-500
  '#ef4444',                   // Red-500
];

Cores hex comuns:
- #10b981 = Verde esmeralda
- #f59e0b = Amarelo/âmbar
- #3b82f6 = Azul
- #8b5cf6 = Violeta
- #ef4444 = Vermelho
- #06b6d4 = Ciano
- #ec4899 = Rosa

Modificação:
const pieColors = [
  '#nova-cor-1',
  '#nova-cor-2',
  // ... mais cores
];

---

### 📍 Modificar KPI Cards da Página Financeira
Arquivo: src/pages/admin/payments/KPICards.tsx
Linhas: 17-42

Atual (4 cards):
const cards = [
  {
    title: "Receita Total",
    icon: DollarSign,
    value: formatBRL(stats.totalRevenue),
    sub: \Ticket médio: \\,
  },
  // ... mais 3 cards
];

Para ADICIONAR novo KPI:
{
  title: "Meu KPI",
  icon: MeuIcone,
  value: "Meu Valor",  // Pode usar formatBRL() para moeda
  sub: "Subtítulo",
}

Para MODIFICAR valores (exemplo):
{
  title: "Faturamento Mensal",
  icon: Calendar,
  value: formatBRL(stats.monthlyRevenue),  // Necessário adicionar a stats
  sub: "Este mês",
}

---

### 📍 Adicionar Novo Filtro em Transações
Arquivo: src/pages/admin/payments/TransactionsPage.tsx
Linhas: 33-48

Exemplo 1 - Adicionar novo STATUS:
const statusOptions = [
  { label: 'Aprovado', value: 'approved' },
  { label: 'Pendente', value: 'pending' },
  // ... existentes
  { label: 'Seu Status', value: 'seu_status_value' },
];

Exemplo 2 - Adicionar novo MÉTODO:
const methodOptions = [
  { label: 'PIX', value: 'pix' },
  { label: 'Cartão de Crédito', value: 'credit_card' },
  // ... existentes
  { label: 'Seu Método', value: 'seu_metodo_value' },
];

---

### 📍 Modificar Labels de Status e Métodos
Arquivo: src/pages/admin/payments/constants.ts

STATUS_LABELS (o que aparece no UI):
export const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',        // Mudar para 'Confirmado'
  pending: 'Pendente',
  in_process: 'Em Processo',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Chargeback',
};

METHOD_LABELS (o que aparece no UI):
export const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
  pending: 'A definir',
};

---

### 📍 Modificar Cores de Status
Arquivo: src/pages/admin/payments/constants.ts
Linhas: 4-12

export const COLORS: Record<string, string> = {
  approved: 'hsl(142, 71%, 45%)',   // Verde
  pending: 'hsl(45, 93%, 47%)',     // Amarelo
  in_process: 'hsl(199, 89%, 48%)', // Azul
  rejected: 'hsl(0, 84%, 60%)',     // Vermelho
  cancelled: 'hsl(0, 0%, 60%)',     // Cinza
  refunded: 'hsl(262, 83%, 58%)',   // Violeta
  charged_back: 'hsl(330, 81%, 60%)', // Rosa
};

Para mudar cor de 'approved' de verde para azul:
approved: 'hsl(199, 89%, 48%)',

Converter cor hex para HSL:
- #10b981 ≈ hsl(161, 72%, 51%)
- #3b82f6 ≈ hsl(217, 92%, 76%)

---

### 📍 Criar Nova Aba no Dashboard Financeiro
Arquivo: src/pages/admin/payments/DashboardPage.tsx
Linhas: 357-402

Atual (5 abas):
<Tabs defaultValue="stripe">
  <TabsList>
    <TabsTrigger value="trends">Tendências</TabsTrigger>
    <TabsTrigger value="success">Taxa de Sucesso</TabsTrigger>
    <TabsTrigger value="methods">Por Método</TabsTrigger>
    <TabsTrigger value="monthly">Mês a Mês</TabsTrigger>
    <TabsTrigger value="stripe">Resumo Stripe</TabsTrigger>
  </TabsList>

  <TabsContent value="trends">
    {/* Conteúdo */}
  </TabsContent>
</Tabs>

Para ADICIONAR nova aba:
1. Adicione trigger:
<TabsTrigger value="minha-aba">Minha Aba</TabsTrigger>

2. Adicione conteúdo:
<TabsContent value="minha-aba" className="animate-fade-in">
  <Suspense fallback={<AnalyticsPanelFallback label="minha aba" />}>
    <MeuComponente data={dados} />
  </Suspense>
</TabsContent>

---

### 📍 Modificar Texto de Cabeçalho
Arquivo: src/pages/admin/Dashboard.tsx
Linhas: 225-230

Atual:
<h1 className="font-heading text-4xl font-extrabold tracking-tight">Dashboard</h1>
<p className="mt-1 text-muted-foreground">
  Bem-vindo de volta! Aqui está o resumo do seu site.
</p>

Para modificar:
<h1 className="font-heading text-4xl font-extrabold tracking-tight">Seu Título</h1>
<p className="mt-1 text-muted-foreground">
  Seu subtítulo aqui
</p>

---

### 📍 Modificar Ordem das Seções
Arquivo: src/pages/admin/Dashboard.tsx
Ordem atual:
1. Período selector + Stats cards (linha 223)
2. Gráfico receita + Receitas destaque (linha 281)
3. Formas pagamento + Status transações (linha 345)
4. 4 Botões de ação (linha 401)

Para mudar ordem:
Copie a seção desejada e mude sua posição no retorno da função.

Exemplo - Colocar botões antes dos gráficos:
Mova linhas 401-431 para antes da linha 281.

---

### 📍 Adicionar Nova Página no Admin
Passos:

1. Crie arquivo em src/pages/admin/MinhaNovaPage.tsx

2. Estrutura básica:
import { PageHead } from '@/components/PageHead';

export default function MinhaNovaPage() {
  return (
    <>
      <PageHead
        title="Meu Título"
        description="Minha descrição"
        noindex={true}
      />
      <div className="space-y-6">
        {/* Seu conteúdo */}
      </div>
    </>
  );
}

3. Adicione rota em src/router.tsx:
{ path: 'minha-pagina', lazy: lazyRoute(() => import('@/pages/admin/MinhaNovaPage')) }

4. Link para acessar:
/admin/minha-pagina

---

## CHECKLIST - BOAS PRÁTICAS

✓ Sempre use lazy loading para componentes grandes
✓ Use Suspense com fallback para lazy components
✓ Mantenha cards e botões responsivos (mobile, tablet, desktop)
✓ Use classes Tailwind em vez de CSS customizado
✓ Sempre adicione PageHead para SEO
✓ Use constants.ts para labels e cores (evita hardcoding)
✓ Imports lucide-react no topo do arquivo
✓ Teste em mobile antes de fazer commit

---

## ARQUIVOS ESSENCIAIS

Modificação de Labels/Cores:
→ src/pages/admin/payments/constants.ts

Adicionar Cards/Botões:
→ src/pages/admin/Dashboard.tsx

Adicionar KPIs Financeiro:
→ src/pages/admin/payments/KPICards.tsx

Adicionar Filtros Transação:
→ src/pages/admin/payments/TransactionsPage.tsx

Adicionar Abas Financeiro:
→ src/pages/admin/payments/DashboardPage.tsx

Roteamento:
→ src/router.tsx

---

## COMANDO GIT PARA FAZER COMMIT

git add src/pages/admin/
git add src/pages/admin/payments/
git commit -m "feat: adicione nova funcionalidade no dashboard"
git push
