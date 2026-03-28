import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChefHat, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";

interface PwaTopBarProps {
  title?: string;
  showBack?: boolean;
  tenantSlug?: string | null;
}

export function PwaTopBar({
  title = "Receitas Bell",
  showBack = false,
  tenantSlug,
}: PwaTopBarProps) {
  const navigate = useNavigate();
  const { clearIdentity } = useAppContext();

  async function handleLogout() {
    try {
      await clearIdentity();
      navigate(buildPwaPath("login", { tenantSlug }), { replace: true });
    } catch {
      toast.error("Erro ao sair.");
    }
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md"
      style={{ height: "var(--pwa-topbar-height)" }}
    >
      <div
        className="mx-auto flex h-full max-w-md items-center justify-between px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 h-9 w-9"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/10">
              <ChefHat className="h-5 w-5" />
            </div>
          )}
          <span className="truncate text-base font-bold tracking-tight text-foreground">
            {title}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={() => void handleLogout()}
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
