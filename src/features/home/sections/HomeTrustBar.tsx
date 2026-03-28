import { Reveal } from "@/components/motion/Reveal";

type HomeTrustBarProps = {
  items: string[];
};

export function HomeTrustBar({ items }: HomeTrustBarProps) {
  if (!items.length) return null;

  return (
    <section className="border-b bg-background/80">
      <div className="container grid gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((item, index) => (
          <Reveal key={item} delayMs={index * 40}>
            <div className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              {item}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
