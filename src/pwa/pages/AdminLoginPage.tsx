import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, LockKeyhole, Mail, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/lib/api/adminSession";
import { ApiClientError } from "@/lib/api/client";
import { InstallAppButton } from "../components/InstallAppButton";

export default function PwaAdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin({ email, password });
      if (result.authenticated) {
        navigate("/pwa/admin", { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Credenciais inválidas.");
      } else {
        setError("Não foi possível autenticar no momento.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <ChefHat className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>
      </div>

      <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
        <CardHeader className="px-0 text-center">
          <CardTitle className="text-xl font-semibold">Acesso Restrito</CardTitle>
          <CardDescription>
            Entre com suas credenciais de administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 text-base"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-10 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm font-medium text-destructive animate-in fade-in">{error}</p>}

            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar no Painel
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
                <span className="bg-background px-2 text-muted-foreground">Ou instale o admin</span>
              </div>
            </div>
            
            <InstallAppButton context="admin" variant="outline" className="w-full h-12" />
          </div>
          
          <Button variant="ghost" className="mt-4 w-full h-12 text-muted-foreground" asChild>
            <Link to="/">Voltar para o site público</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
