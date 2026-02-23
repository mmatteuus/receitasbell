"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Save } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    // Carregar dados do localStorage ao montar o componente
    const storedProfile = localStorage.getItem("receitas_bell_user_profile");
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setValue("name", parsed.name);
        setValue("email", parsed.email);
      } catch (e) {
        console.error("Erro ao carregar perfil", e);
      }
    }
  }, [setValue]);

  const onSubmit = (data: ProfileFormData) => {
    // Simular um delay de rede e salvar
    localStorage.setItem("receitas_bell_user_profile", JSON.stringify(data));
    toast.success("Perfil atualizado com sucesso!");
  };

  return (
    <div className="container max-w-lg py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" placeholder="Seu nome" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}