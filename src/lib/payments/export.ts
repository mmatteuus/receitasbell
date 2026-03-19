import { Payment } from './types';

const statusLabels: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  in_process: 'Em processo',
  charged_back: 'Chargeback',
};

const methodLabels: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
  pending: 'A definir',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function exportPaymentsCSV(payments: Payment[], filename = 'pagamentos') {
  const header = [
    'ID',
    'Status',
    'Método',
    'Valor (R$)',
    'Email',
    'Itens',
    'Criado em',
    'Aprovado em',
  ];
  const rows = payments.map((p) => [
    p.id,
    statusLabels[p.status] || p.status,
    methodLabels[p.paymentMethodKey || p.paymentMethod] || p.paymentMethod,
    p.totalBRL.toFixed(2).replace('.', ','),
    p.payerEmail,
    p.items.map((item) => item.title).join(' | '),
    formatDate(p.createdAt),
    formatDate(p.approvedAt || null),
  ]);

  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportPaymentsPDF(payments: Payment[], filename = 'pagamentos') {
  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((s, p) => s + p.totalBRL, 0);

  const rows = payments
    .map(
      (p) =>
        `<tr>
          <td>${p.id}</td>
          <td>${statusLabels[p.status] || p.status}</td>
          <td>${methodLabels[p.paymentMethodKey || p.paymentMethod] || p.paymentMethod}</td>
          <td style="text-align:right">R$ ${p.totalBRL.toFixed(2)}</td>
          <td>${p.payerEmail}</td>
          <td>${p.items.map((item) => item.title).join(', ')}</td>
          <td>${formatDate(p.createdAt)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Relatório de Pagamentos</title>
<style>
  body{font-family:system-ui,sans-serif;padding:40px;color:#222}
  h1{font-size:20px;margin-bottom:4px}
  .meta{color:#666;font-size:13px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
  th{background:#f5f5f5;font-weight:600}
  .summary{margin-top:16px;font-size:14px}
</style></head><body>
<h1>Relatório de Pagamentos</h1>
<p class="meta">Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${payments.length} transações</p>
<table><thead><tr>
  <th>ID</th><th>Status</th><th>Método</th><th>Valor</th><th>Email</th><th>Receita</th><th>Data</th>
</tr></thead><tbody>${rows}</tbody></table>
<p class="summary"><strong>Receita Total (Aprovados):</strong> R$ ${totalRevenue.toFixed(2)}</p>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
