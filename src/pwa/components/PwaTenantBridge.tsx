import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { persistActiveTenantSlug } from "@/pwa/app/tenant/pwa-tenant-storage";
import { buildTenantAwarePwaPath } from "@/pwa/app/tenant/pwa-tenant-path";

export function PwaTenantBridge({ children }: { children: ReactNode }) {
  const { tenantSlug } = useParams();

  useEffect(() => {
    if (tenantSlug) {
      persistActiveTenantSlug(tenantSlug);
    }
  }, [tenantSlug]);

  return <>{children}</>;
}

export function PwaTenantRuntimeRedirect({
  targetBasePath,
}: {
  targetBasePath: string;
}) {
  const params = useParams();
  const location = useLocation();
  const tenantSlug = params.tenantSlug;
  const wildcard = params["*"];

  useEffect(() => {
    if (tenantSlug) {
      persistActiveTenantSlug(tenantSlug);
    }
  }, [tenantSlug]);

  const normalizedBasePath = targetBasePath.replace(/\/+$/, "");
  const suffix = wildcard?.trim() ? `/${wildcard.replace(/^\/+/, "")}` : "";
  const search = location.search || "";
  const hash = location.hash || "";
  const targetPath = `${normalizedBasePath}${suffix}${search}${hash}`;

  return <Navigate to={buildTenantAwarePwaPath(targetPath, null)} replace />;
}
