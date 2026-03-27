import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/api/interactions";
import { ApiClientError } from "@/lib/api/client";
import { useAppContext } from "@/contexts/app-context";
import { toast } from "sonner";
import type { Comment } from "@/types/recipe";

interface RecipeCommentsProps {
  recipeId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export default function RecipeComments({ recipeId, comments, onCommentAdded }: RecipeCommentsProps) {
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const { requireIdentity } = useAppContext();

  async function handleComment(event: React.FormEvent) {
    event.preventDefault();
    if (!author.trim() || !commentText.trim()) return;

    const email = await requireIdentity("Digite seu e-mail para comentar.");
    if (!email) return;

    try {
      const comment = await createComment({
        recipeId,
        authorName: author.trim(),
        text: commentText.trim(),
      });
      onCommentAdded(comment);
      setAuthor("");
      setCommentText("");
      toast.success("Comentário publicado");
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
        return;
      }
      console.error("Failed to create comment", error);
      toast.error("Não foi possível publicar seu comentário.");
    }
  }

  return (
    <>
      <h2 className="font-heading text-xl font-bold sm:text-2xl print:hidden">Comentários ({comments.length})</h2>
      <form onSubmit={handleComment} className="mt-4 space-y-3 rounded-lg border bg-card p-4 print:hidden">
        <Input placeholder="Seu nome" value={author} onChange={(event) => setAuthor(event.target.value)} />
        <Textarea placeholder="Deixe seu comentário..." value={commentText} onChange={(event) => setCommentText(event.target.value)} rows={3} />
        <Button type="submit" size="sm">Comentar</Button>
      </form>

      {comments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{comment.author}</span>
                <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{comment.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground print:hidden">Seja a primeira pessoa a comentar esta receita.</p>
      )}
    </>
  );
}
