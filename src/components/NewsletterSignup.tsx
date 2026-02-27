import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "rdb_newsletter_subscribers";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!emailPattern.test(normalized)) {
      setStatus("error");
      setMessage("Informe um e-mail válido para receber as novidades.");
      return;
    }
    const stored = (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    if (stored.includes(normalized)) {
      setStatus("success");
      setMessage("Você já está na nossa lista! Obrigado pela confiança.");
      setEmail("");
      return;
    }
    const next = [...stored, normalized];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStatus("success");
    setMessage("Recebemos seu e-mail! Fique de olho na caixa de entrada.");
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <label htmlFor="newsletter-email" className="sr-only">
        Endereço de e-mail
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="newsletter-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full sm:w-auto">
          Assinar
        </Button>
      </div>
      {message && (
        <p
          role="status"
          className={`mt-3 text-sm ${status === "success" ? "text-green-600" : "text-destructive"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
