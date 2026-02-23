"use client";

import { useDemoPurchase } from "@/src/hooks/use-demo-purchase";
import Link from "next/next/link";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function BibliotecaPage() {
  const { purchasedIds } = useDemoPurchase();

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold">Minha Biblioteca</h1>

      {purchasedIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Sua biblioteca está vazia</h2>
          <p className="mb-6 text-muted-foreground">Você ainda não adquiriu nenhuma receita paga.</p>
          <Button asChild>
            <Link href="/">Explorar Receitas</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {purchasedIds.map(id => (
            <div key={id} className="rounded-lg border p-4">
              <p className="font-bold">Receita: {id}</p>
              <Link href={`/receitas/${id}`} className="text-orange-600 hover:underline">Ver receita completa</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}