
import { cn } from "@/lib/utils";
import { PaymentStatus } from "@/lib/payments/types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status: PaymentStatus;
  statusDetail: string;
  className?: string;
}

const statusStyles: Record<PaymentStatus, string> = {
  approved: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  in_process: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  rejected: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
  charged_back: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
};

const statusLabels: Record<PaymentStatus, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    in_process: "Em processamento",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    charged_back: "Chargeback",
}

export function StatusBadge({ status, statusDetail, className }: StatusBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className={cn(statusStyles[status], className)}
          >
            {statusLabels[status]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusDetail}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
