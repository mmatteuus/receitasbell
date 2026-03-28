import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SmartImage from "@/components/SmartImage";
import type { SettingsMap } from "@/types/settings";

type HomeAboutProps = {
  settings: SettingsMap;
  onLearnMore: () => void;
};

export function HomeAbout({ settings, onLearnMore }: HomeAboutProps) {
  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="grid items-center gap-7 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary dark:bg-primary/20 dark:text-orange-400">
              Sobre a marca
            </Badge>
            <h2 className="text-3xl">{settings.aboutHeadline}</h2>
            <p className="text-muted-foreground">{settings.aboutText}</p>
            <Button
              variant="outline"
              onClick={onLearnMore}
              className="gap-2"
            >
              Conhecer mais
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          <SmartImage
            src={settings.aboutImageUrl}
            alt={settings.siteName}
            className="h-[260px] w-full rounded-2xl object-cover sm:h-[320px]"
          />
        </div>
      </Reveal>
    </section>
  );
}
