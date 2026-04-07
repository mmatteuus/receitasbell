import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

type NewCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description: string;
  icon: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onCreate: () => void | Promise<void>;
  disabled?: boolean;
};

export function NewCategoryDialog({
  open,
  onOpenChange,
  name,
  description,
  icon,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onCreate,
  disabled,
}: NewCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-10 sm:px-0"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          <span className="ml-2 sm:hidden">Nova categoria</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">
              Ícone ou Emoji
            </label>
            <Input
              value={icon}
              onChange={(event) => onIconChange(event.target.value)}
              placeholder="🍕 ou ⭐ ou qualquer ícone/emoji"
              maxLength={4}
              className="text-center text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cole um emoji (🍕, 🥗, 🍰, etc) ou use um ícone
            </p>
          </div>
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Nome da categoria"
          />
          <Input
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Descrição (opcional)"
          />
          <Button onClick={() => void onCreate()} className="w-full" disabled={disabled}>
            Criar categoria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
