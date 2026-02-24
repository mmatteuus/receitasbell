import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function NewsletterForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aqui entraria a lógica de integração com serviço de e-mail
    toast.success("Inscrição realizada com sucesso! Verifique seu e-mail.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center gap-2">
      <Input 
        type="email" 
        placeholder="Seu melhor e-mail" 
        className="bg-background font-sans"
        required 
      />
      <Button type="submit" className="font-sans shrink-0">
        <Mail className="mr-2 h-4 w-4" />
        Assinar
      </Button>
    </form>
  );
}