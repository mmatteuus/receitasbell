import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TeaserPreviewProps = {
  teaser: {
    ingredients: string[];
    instructions: string[];
  };
};

export function TeaserPreview({ teaser }: TeaserPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaser Automático</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">Ingredientes liberados</p>
            <p className="text-xs text-muted-foreground">Os 2 primeiros itens aparecem antes da compra.</p>
          </div>
          <ul className="space-y-2 text-sm">
            {teaser.ingredients.length > 0 ? (
              teaser.ingredients.map((ingredient) => (
                <li key={ingredient} className="rounded-lg border bg-background px-3 py-2">
                  {ingredient}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Adicione ingredientes para gerar o teaser.</li>
            )}
          </ul>
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">Passos liberados</p>
            <p className="text-xs text-muted-foreground">Os 2 primeiros passos aparecem antes da compra.</p>
          </div>
          <ol className="space-y-2 text-sm">
            {teaser.instructions.length > 0 ? (
              teaser.instructions.map((step, index) => (
                <li key={`${index}-${step}`} className="rounded-lg border bg-background px-3 py-2">
                  {index + 1}. {step}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Adicione o modo de preparo para gerar o teaser.</li>
            )}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
