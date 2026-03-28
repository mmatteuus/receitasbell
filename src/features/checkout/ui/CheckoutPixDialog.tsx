import { Copy, QrCode, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DirectPaymentResult } from "@/types/payment";

type CheckoutPixDialogProps = {
  open: boolean;
  payment: DirectPaymentResult | null;
  checking: boolean;
  onCopyCode: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
};

export function CheckoutPixDialog({
  open,
  payment,
  checking,
  onCopyCode,
  onOpenChange,
}: CheckoutPixDialogProps) {
  const hasQrImage = Boolean(payment?.qrCodeBase64);
  const hasQrCode = Boolean(payment?.qrCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-600" />
            Pague com PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código abaixo. A confirmação será detectada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasQrImage ? (
            <div className="rounded-xl border bg-white p-4">
              <img
                src={`data:image/png;base64,${payment?.qrCodeBase64}`}
                alt="QR Code PIX"
                className="mx-auto h-56 w-56 object-contain"
              />
            </div>
          ) : null}

          {hasQrCode ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Código PIX copia e cola</label>
              <textarea
                readOnly
                value={payment?.qrCode || ""}
                className="min-h-28 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground outline-none"
              />
              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => void onCopyCode()}>
                <Copy className="h-4 w-4" />
                Copiar código PIX
              </Button>
            </div>
          ) : null}

          {payment?.paymentId ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Pedido: <span className="font-mono text-foreground">{payment.paymentOrderId}</span>
              <br />
              Pagamento MP: <span className="font-mono text-foreground">{payment.paymentId}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <RefreshCcw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Verificando pagamento..." : "Aguardando a confirmação do PIX."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
