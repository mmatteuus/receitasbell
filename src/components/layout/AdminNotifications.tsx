import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { paymentRepo } from "@/lib/repos/paymentRepo";
import type { Payment } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

export function AdminNotifications() {
  const [lastSeen, setLastSeen] = useState<string>(
    () => localStorage.getItem("rdb_notif_last_seen") || ""
  );
  const [open, setOpen] = useState(false);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const payments = await paymentRepo.list({ dateFrom: cutoff.toISOString() });
        setRecentPayments(payments.slice(0, 10));
      } catch (error) {
        console.error("Failed to load admin notifications", error);
      }
    }

    void loadNotifications();
  }, []);

  const unseenCount = useMemo(() => {
    if (!lastSeen) return recentPayments.length;
    return recentPayments.filter(
      (p) => new Date(p.createdAt) > new Date(lastSeen)
    ).length;
  }, [recentPayments, lastSeen]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && recentPayments.length > 0) {
      const now = new Date().toISOString();
      localStorage.setItem("rdb_notif_last_seen", now);
      setLastSeen(now);
    }
  };

  const statusLabels: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    in_process: "Em processo",
    charged_back: "Chargeback",
  };

  const statusColors: Record<string, string> = {
    approved: "text-emerald-500",
    pending: "text-amber-500",
    rejected: "text-destructive",
    cancelled: "text-muted-foreground",
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center">
              {unseenCount > 9 ? "9+" : unseenCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notificações</h3>
          <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {recentPayments.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação recente
            </p>
          ) : (
            recentPayments.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-start gap-3 border-b last:border-0 px-4 py-3 text-sm",
                  !lastSeen || new Date(p.createdAt) > new Date(lastSeen)
                    ? "bg-muted/40"
                    : ""
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    Pedido #{p.id} –{" "}
                    <span className={statusColors[p.status] || "text-foreground"}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.payer.email} · R$ {p.totalBRL.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
