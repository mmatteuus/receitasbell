import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Mail, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, requestMagicLink } from "@/lib/api/identity";
import { InstallAppButton } from "../components/InstallAppButton";

export default function UserLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    
    if (!isValidEmail(normalized)) {
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      await requestMagicLink({
        email: normalized,
        redirectTo: "/pwa/app",
      });

      setSent(true);
      toast.success("Link de acesso enviado!");
    } catch {
      toast.error("Ocorreu um erro ao enviar o link. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm border-none shadow-none bg-transparent text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Verifique seu e-mail</CardTitle>
              <CardDescription className="text-base">
                Enviamos um link de acesso para <strong>{email}</strong>. Clique no link para entrar no app.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setSent(false)}
            >
              Tentar com outro e-mail
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <ChefHat className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Receitas Bell</h1>
      </div>

      <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
        <CardHeader className="px-0 text-center">
          <CardTitle className="text-xl font-semibold">Entrar</CardTitle>
          <CardDescription>
            Informe seu e-mail para acessar suas receitas e favoritos.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Entrar com link mágico
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou instale o app</span>
              </div>
            </div>
            
            <InstallAppButton context="user" variant="outline" className="w-full h-12" />
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Não tem uma conta? Ao entrar, nós criaremos uma para você.
      </p>
    </div>
  );
}
