import { Link, useNavigate } from "react-router-dom";
import { ChefHat, ArrowLeft, LogOut } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PwaTopBarProps {
  title?: string;
  showBack?: boolean;
}

export function PwaTopBar({ title = "Receitas Bell", showBack = false }: PwaTopBarProps) {
  const navigate = useNavigate();
  const { clearIdentity } = useAppContext();

  const handleLogout = async () => {
    try {
      await clearIdentity();
      navigate("/pwa/login", { replace: true });
    } catch {
      toast.error("Erro ao sair.");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-background/80 backdrop-blur-md border-b border-border safe-area-top">
      <div className="container flex items-center justify-between h-full px-4 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/10">
              <ChefHat className="h-5 w-5" />
            </div>
          )}
          <span className="font-bold tracking-tight text-foreground truncate max-w-[180px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
