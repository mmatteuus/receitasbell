import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { User, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface CommentsSectionProps {
  recipeId: string;
}

export function CommentsSection({ recipeId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`receitas_bell_comments_${recipeId}`);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse comments", e);
      }
    }
  }, [recipeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: authorName.trim() || "Visitante",
      text: newComment,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(`receitas_bell_comments_${recipeId}`, JSON.stringify(updatedComments));
    
    setNewComment("");
    toast.success("Comentário enviado!");
  };

  return (
    <section className="mt-12 border-t pt-10">
      <h3 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        Comentários ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-10 space-y-4 bg-muted/30 p-6 rounded-xl border">
        <div className="grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
             <label htmlFor="author" className="text-sm font-medium font-sans">Seu Nome</label>
             <Input 
               id="author" 
               placeholder="Ex: Maria Silva" 
               value={authorName}
               onChange={(e) => setAuthorName(e.target.value)}
               className="bg-background font-sans"
             />
           </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium font-sans">Seu Comentário</label>
          <Textarea 
            id="comment" 
            placeholder="O que você achou desta receita?" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-background min-h-[100px] font-sans"
            required
          />
        </div>
        <Button type="submit" className="gap-2 font-sans">
          <Send className="h-4 w-4" />
          Enviar Comentário
        </Button>
      </form>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 font-sans">Seja o primeiro a comentar!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold font-serif">{comment.author}</span>
                  <span className="text-xs text-muted-foreground font-sans">
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}