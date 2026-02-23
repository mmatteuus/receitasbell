import { Link } from "react-router-dom";
import { PlusCircle, List, FileText, Eye, FilePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecipes } from "@/lib/storage";

export default function Dashboard() {
  const recipes = getRecipes();
  const published = recipes.filter((r) => r.status === "published").length;
  const drafts = recipes.filter((r) => r.status === "draft").length;

  const stats = [
    { label: "Total", value: recipes.length, icon: FileText, color: "text-foreground" },
    { label: "Publicadas", value: published, icon: Eye, color: "text-success" },
    { label: "Rascunhos", value: drafts, icon: FilePen, color: "text-warning" },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Visão geral do seu site de receitas</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/receitas/nova">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Criar Receita
          </Button>
        </Link>
        <Link to="/admin/receitas">
          <Button variant="outline" className="gap-2">
            <List className="h-4 w-4" />
            Gerenciar Receitas
          </Button>
        </Link>
      </div>
    </div>
  );
}
