import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

type NewCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: () => void | Promise<void>;
  disabled?: boolean;
};

export function NewCategoryDialog({
  open,
  onOpenChange,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onCreate,
  disabled,
}: NewCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full sm:w-10 sm:px-0" disabled={disabled}>
          <Plus className="h-4 w-4" />
          <span className="ml-2 sm:hidden">Nova categoria</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Nome"
          />
          <Input
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Descrição"
          />
          <Button onClick={() => void onCreate()} className="w-full" disabled={disabled}>
            Criar categoria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
