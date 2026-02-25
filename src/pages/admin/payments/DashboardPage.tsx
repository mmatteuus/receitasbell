
import { useEffect, useState } from "react";
import { paymentsRepo } from "@/lib/payments/repo";
import { Payment } from "@/lib/payments/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";

const getRevenue = (payments: Payment[]) => payments.reduce((acc, p) => p.status === 'approved' ? acc + p.transaction_amount : acc, 0);

const getRevenueByDay = (payments: Payment[]) => {
    const revenueByDay: { [key: string]: number } = {};
    payments.forEach(p => {
        if (p.status === 'approved' && p.date_approved) {
            const day = new Date(p.date_approved).toISOString().split('T')[0];
            revenueByDay[day] = (revenueByDay[day] || 0) + p.transaction_amount;
        }
    });
    return Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const getStatusDistribution = (payments: Payment[]) => {
    const statusCount: { [key: string]: number } = {};
    payments.forEach(p => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
}

export default function DashboardPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);
        return { from, to };
    });

    const filterPayments = () => {
        setLoading(true);
        const filtered = paymentsRepo.listPayments({
            dateFrom: dateRange?.from?.toISOString(),
            dateTo: dateRange?.to?.toISOString(),
        });
        setPayments(filtered);
        setLoading(false);
    }

    useEffect(() => {
        filterPayments();
    }, [dateRange]);

    const totalRevenue = getRevenue(payments);
    const totalPayments = payments.length;
    const approvedPayments = payments.filter(p => p.status === 'approved').length;
    const approvalRate = totalPayments > 0 ? (approvedPayments / totalPayments) * 100 : 0;
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'in_process').length;
    const refundedPayments = payments.filter(p => p.status === 'refunded' || p.status === 'charged_back').length;

    const revenueByDay = getRevenueByDay(payments);
    const statusDistribution = getStatusDistribution(payments);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard de Pagamentos</h1>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange onSelect={setDateRange} />
                    <Button onClick={() => {
                        const to = new Date();
                        const from = new Date();
                        from.setDate(from.getDate() - 7);
                        setDateRange({ from, to });
                    }}>Últimos 7 dias</Button>
                    <Button onClick={() => {
                        const to = new Date();
                        const from = new Date();
                        from.setDate(from.getDate() - 30);
                        setDateRange({ from, to });
                    }}>Últimos 30 dias</Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><div className="h-8 bg-gray-200 rounded animate-pulse"></div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><div className="h-8 bg-gray-200 rounded animate-pulse"></div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><div className="h-8 bg-gray-200 rounded animate-pulse"></div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><div className="h-8 bg-gray-200 rounded animate-pulse"></div></CardContent></Card>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPayments}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{approvalRate.toFixed(2)}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingPayments}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reembolsos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{refundedPayments}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Receita por Dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueByDay}>
                                <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR')} />
                                <YAxis tickFormatter={(val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)} />
                                <Tooltip formatter={(val: number) => [new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val), 'Receita']} />
                                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição de Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statusDistribution}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
