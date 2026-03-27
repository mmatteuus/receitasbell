import { Moon, Sun } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ThemeModeToggleProps = {
  compact?: boolean;
  className?: string;
  onClick?: () => void;
};

export default function ThemeModeToggle({
  compact = false,
  className,
  onClick,
}: ThemeModeToggleProps) {
  const { theme, toggleTheme } = useAppContext();
  const nextLabel = theme === "light" ? "Modo escuro" : "Modo claro";

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={cn("gap-2", className)}
      onClick={() => {
        toggleTheme();
        onClick?.();
      }}
      aria-label={nextLabel}
      title={nextLabel}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {!compact && <span>{nextLabel}</span>}
    </Button>
  );
}
