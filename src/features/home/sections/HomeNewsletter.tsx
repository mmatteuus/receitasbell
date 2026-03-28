import { Reveal } from "@/components/motion/Reveal";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export function HomeNewsletter() {
  return (
    <section className="border-t bg-muted/40 py-14">
      <div className="container px-4">
        <Reveal>
          <div className="rounded-3xl border bg-card p-8 text-center sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Newsletter semanal
            </p>
            <h2 className="mt-3 text-3xl">Receba cardápios, técnicas e novidades da semana</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Uma seleção prática para facilitar o planejamento das refeições e descobrir novas
              receitas com curadoria.
            </p>
            <div className="mt-6 flex justify-center">
              <NewsletterSignup />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
