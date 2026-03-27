import { useState } from "react";
import { Share2, Copy, Facebook, MessageCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    return `${window.location.origin}/receitas/${slug}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar.");
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${title} - ${getUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleFacebook = () => {
    const u = encodeURIComponent(getUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank");
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-2 print:hidden">
        <Share2 aria-hidden="true" className="h-4 w-4" />
        Compartilhar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300 print:hidden">
      <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar Link">
        {copied ? <Check aria-hidden="true" className="h-4 w-4 text-green-500" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
      </Button>
      <Button variant="outline" size="icon" onClick={handleWhatsApp} aria-label="Compartilhar no WhatsApp" className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30">
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleFacebook} aria-label="Compartilhar no Facebook" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
        <Facebook aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar opções de compartilhamento">
        <X aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}