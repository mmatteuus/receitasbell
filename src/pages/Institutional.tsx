import { useParams, Link } from "react-router-dom";
import { Mail, FileText, Shield } from "lucide-react";

const pages: Record<string, { title: string; icon: React.ElementType; content: string }> = {
  contato: {
    title: "Contato",
    icon: Mail,
    content: "Entre em contato conosco pelo e-mail contato@receitasdobell.com.br. Responderemos em até 48 horas úteis. Adoramos receber sugestões de receitas, feedbacks e parcerias!",
  },
  termos: {
    title: "Termos de Uso",
    icon: FileText,
    content: "Ao acessar e utilizar o site Receitas do Bell, você concorda com os seguintes termos: Todo o conteúdo publicado é de propriedade do Receitas do Bell. É permitido compartilhar links, mas não copiar conteúdo sem autorização. Os comentários são moderados e reservamos o direito de remover conteúdo impróprio. As receitas são compartilhadas sem garantias sobre resultados — cozinhar é uma arte que depende de prática!",
  },
  privacidade: {
    title: "Política de Privacidade",
    icon: Shield,
    content: "O Receitas do Bell respeita a sua privacidade. Nesta versão protótipo, os dados são armazenados apenas localmente no seu navegador (localStorage). Não coletamos, transmitimos ou armazenamos dados pessoais em servidores. Na versão final, implementaremos políticas completas de proteção de dados conforme a LGPD.",
  },
};

export default function Institutional() {
  const { page } = useParams<{ page: string }>();
  const info = pages[page || ""];

  if (!info) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-heading text-3xl font-bold">Página não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link> › {info.title}
      </div>
      <div className="flex items-center gap-3">
        <info.icon className="h-7 w-7 text-primary" />
        <h1 className="font-heading text-3xl font-bold">{info.title}</h1>
      </div>
      <p className="mt-6 leading-relaxed text-muted-foreground">{info.content}</p>
    </div>
  );
}
