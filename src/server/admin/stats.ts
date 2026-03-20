import { getPrisma } from "../db/prisma.js";
import { sumBRL } from "../../lib/utils/money.js";

export async function getTenantFinancialStats(tenantId: string) {
  const prisma = getPrisma();
  
  // Pegamos a data de início do mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
