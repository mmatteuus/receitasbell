import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 2 * window.innerHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-white text-muted-foreground hover:bg-orange-100 hover:text-orange-600 dark:bg-card dark:text-foreground dark:hover:bg-orange-900/30 dark:hover:text-orange-400 print:hidden",
        "right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:right-6 sm:bottom-[calc(env(safe-area-inset-bottom,0px)+2rem)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-6 w-6" />
    </Button>
  );
}
