import { Button } from "@/components/ui/button";
import { type ButtonVariantProps } from "@/components/ui/button-variants";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { Smartphone } from "lucide-react";
import type { InstallContext } from "../lib/install-context";

interface InstallAppButtonProps {
  context: InstallContext;
  className?: string;
  variant?: ButtonVariantProps["variant"];
  size?: ButtonVariantProps["size"];
}

export function InstallAppButton({ 
  context, 
  className, 
  variant = "default",
  size = "default" 
}: InstallAppButtonProps) {
  const { deferredPrompt, isInstalled, install, isIOS } = useInstallPrompt();

  // If already installed, don't show the button
  if (isInstalled) return null;

  // On iOS, handle with a hint component or instructions
  // For the button, we'll only show if deferredPrompt is available (Android/Chrome)
  if (!deferredPrompt && !isIOS) return null;

  const handleInstall = () => {
    if (deferredPrompt) {
      install(context);
    } else if (isIOS) {
      // For iOS, maybe open a dialog with instructions
      // This will be handled by PwaInstallHintIOS separately
    }
  };

  return (
    <Button 
      onClick={handleInstall} 
      className={className} 
      variant={variant}
      size={size}
    >
      <Smartphone className="mr-2 h-4 w-4" />
      Instalar App
    </Button>
  );
}
