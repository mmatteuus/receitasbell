import { Facebook, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const openWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openWindow(`https://wa.me/?text=${encodedTitle} ${encodedUrl}`)}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Compartilhar no WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="sr-only">WhatsApp</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Compartilhar no Facebook"
      >
        <Facebook className="h-5 w-5" />
        <span className="sr-only">Facebook</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openWindow(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`)}
        className="text-sky-500 hover:text-sky-600 hover:bg-sky-50"
        title="Compartilhar no Twitter"
      >
        <Twitter className="h-5 w-5" />
        <span className="sr-only">Twitter</span>
      </Button>
    </div>
  );
}