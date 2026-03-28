import { Link } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineLockedScreen({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <WifiOff className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild className="w-full">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
