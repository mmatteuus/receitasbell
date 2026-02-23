import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] py-20 text-center animate-in fade-in zoom-in duration-500">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 mb-6">
        <FileQuestion className="h-12 w-12" />
      </div>
      
      <h1 className="mb-4 text-4xl font-bold tracking-tight font-heading lg:text-5xl">
        404 - Página não encontrada
      </h1>
      
      <p className="max-w-md mb-8 text-lg text-muted-foreground">
        Ops! A página que você está procurando não existe, foi movida ou o link está incorreto.
      </p>
      
      <div className="flex gap-4">
        <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  );
}