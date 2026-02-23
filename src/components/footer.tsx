import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-orange-50 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-orange-600">Receitas do Bell</h2>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Receitas do Bell. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Desenvolvido por <a href="https://mtsferreira.dev" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">MtsFerreira</a>
          </p>
        </div>
        
        <div className="flex gap-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white p-2 text-orange-600 shadow-sm transition-colors hover:bg-orange-100 dark:bg-zinc-800 dark:text-orange-400 dark:hover:bg-zinc-700"
            aria-label="Facebook"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white p-2 text-orange-600 shadow-sm transition-colors hover:bg-orange-100 dark:bg-zinc-800 dark:text-orange-400 dark:hover:bg-zinc-700"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white p-2 text-orange-600 shadow-sm transition-colors hover:bg-orange-100 dark:bg-zinc-800 dark:text-orange-400 dark:hover:bg-zinc-700"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}