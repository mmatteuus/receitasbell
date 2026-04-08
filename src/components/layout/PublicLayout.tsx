import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "./Header";
import { Footer } from "./Footer";
import { BackToTop } from "@/components/BackToTop";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        {/* Manifesto do PWA do usuário — inicia na tela inicial do app */}
        <link rel="manifest" href="/manifest.webmanifest" />
      </Helmet>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Pular para conteúdo principal
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
