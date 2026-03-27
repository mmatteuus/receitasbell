import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getInstallContext } from "../lib/install-context";

export default function PwaEntryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const context = getInstallContext();
    if (context === "admin") {
      navigate("/pwa/admin/login", { replace: true });
    } else {
      navigate("/pwa/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground tracking-tight">
          Iniciando Receitas Bell...
        </p>
      </div>
    </div>
  );
}
