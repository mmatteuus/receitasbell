import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditorState } from "../schema";

type SeoSectionProps = {
  form: EditorState;
  onFieldChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
};

export function SeoSection({ form, onFieldChange }: SeoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO e publicação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Resumo</Label>
          <Textarea value={form.excerpt} onChange={(event) => onFieldChange("excerpt", event.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>SEO title</Label>
          <Input value={form.seoTitle} onChange={(event) => onFieldChange("seoTitle", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>SEO description</Label>
          <Textarea value={form.seoDescription} onChange={(event) => onFieldChange("seoDescription", event.target.value)} rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant={form.isFeatured ? "default" : "outline"} onClick={() => onFieldChange("isFeatured", !form.isFeatured)}>
            {form.isFeatured ? "Em destaque" : "Marcar como destaque"}
          </Button>
          <Badge variant={form.status === "published" ? "default" : "secondary"}>
            {form.status === "published" ? "Publicado" : "Rascunho"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
