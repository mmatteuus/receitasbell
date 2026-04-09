import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import type { EditorState } from '../schema';

type MediaSectionProps = {
  form: EditorState;
  isOffline: boolean;
  uploadingImage: boolean;
  onImageSelect: (file: File | null) => void | Promise<void>;
  onRemoveImage: () => void | Promise<void>;
};

export function MediaSection({
  form,
  isOffline,
  uploadingImage,
  onImageSelect,
  onRemoveImage,
}: MediaSectionProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Imagem da receita</Label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="file"
              accept="image/*"
              disabled={uploadingImage || isOffline}
              onChange={(event) => void onImageSelect(event.target.files?.[0] || null)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!form.imageUrl || uploadingImage || isOffline}
              onClick={() => void onRemoveImage()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A imagem é armazenada em storage seguro e apenas a URL é mantida no banco de dados.
          </p>
        </div>
      </div>

      {(form.imagePreviewUrl || form.imageUrl) && (
        <div className="overflow-hidden rounded-xl border">
          <img
            src={form.imagePreviewUrl || form.imageUrl}
            alt="Preview"
            className="h-56 w-full object-cover"
          />
        </div>
      )}
    </>
  );
}
