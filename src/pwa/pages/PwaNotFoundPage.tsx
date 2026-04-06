import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';

export default function PwaNotFoundPage() {
  const tenantSlug = resolvePwaTenantSlug();

  return (
    <>
      <PageHead title="Página não encontrada" noindex />
      <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Search className="h-10 w-10" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Página não encontrada</h1>
        <p className="mb-8 text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild className="h-12 w-full">
          <Link to={buildPwaPath('home', { tenantSlug })}>Voltar para o Início</Link>
        </Button>
      </div>
    </>
  );
}
