import { sumBRL } from "../../lib/utils/money.js";
import { listPayments } from "../baserow/paymentsRepo.js";

export async function getTenantFinancialStats(tenantId: string | number) {
  // Pegamos a data de início do mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // No Baserow buscamos todos os pagamentos do tenant e processamos em memória para o MVP
  const allPayments = await listPayments(tenantId);
  
  const approved = allPayments.filter(p => p.status === "approved");
  const monthApproved = approved.filter(p => {
    const date = p.createdAt ? new Date(p.createdAt) : new Date();
    return date >= startOfMonth;
  });

  const recentPayments = allPayments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalRevenue: sumBRL(approved.map(p => p.amount)),
    monthlyRevenue: sumBRL(monthApproved.map(p => p.amount)),
    recentPayments: recentPayments.map(p => ({
      id: String(p.id),
      amount: p.amount,
      status: p.status,
      buyerEmail: p.payerEmail,
      createdAt: p.createdAt,
      method: p.paymentMethod || "unknown",
    }))
  };
}
