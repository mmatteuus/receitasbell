import { getPrisma, isDatabaseConfigured } from "../db/prisma.js";
import { sumBRL } from "../../lib/utils/money.js";
import { listPayments } from "../sheets/paymentsRepo.js";

export async function getTenantFinancialStats(tenantId: string) {
  // Pegamos a data de início do mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (!isDatabaseConfigured()) {
    // SINGLE TENANT FALLBACK (Google Sheets)
    const allPayments = await listPayments();
    
    const approved = allPayments.filter(p => p.status === "approved");
    const monthApproved = approved.filter(p => {
      const date = p.approvedAt ? new Date(p.approvedAt) : new Date(p.createdAt);
      return date >= startOfMonth;
    });
    const recentPayments = allPayments.slice(0, 5);

    return {
      totalRevenue: sumBRL(approved.map(p => p.totalBRL)),
      monthlyRevenue: sumBRL(monthApproved.map(p => p.totalBRL)),
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        amount: p.totalBRL,
        status: p.status,
        buyerEmail: p.payerEmail,
        createdAt: p.createdAt,
        method: p.paymentMethod,
      }))
    };
  }

  const prisma = getPrisma();

  const [allApproved, monthApproved, recentPayments] = await Promise.all([
    // Faturamento Total (Aprovados)
    prisma.payment.aggregate({
      where: { tenantId, status: "approved" },
      _sum: { amount: true },
    }),
    // Faturamento do Mês (Aprovados)
    prisma.payment.aggregate({
      where: { 
        tenantId, 
        status: "approved",
        approvedAt: { gte: startOfMonth }
      },
      _sum: { amount: true },
    }),
    // Últimas 5 transações
    prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
  ]);

  return {
    totalRevenue: Number(allApproved._sum.amount || 0),
    monthlyRevenue: Number(monthApproved._sum.amount || 0),
    recentPayments: recentPayments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      buyerEmail: p.buyerEmail,
      createdAt: p.createdAt.toISOString(),
      method: p.paymentMethod,
    }))
  };
}
