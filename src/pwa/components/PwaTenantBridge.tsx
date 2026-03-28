import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { setActiveTenantSlug } from "@/lib/tenant";

export function PwaTenantBridge({ children }: { children: ReactNode }) {
  const { tenantSlug } = useParams();

  useEffect(() => {
    if (tenantSlug) {
      setActiveTenantSlug(tenantSlug);
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
      setActiveTenantSlug(tenantSlug);
    }
  }, [tenantSlug]);

  const normalizedBasePath = targetBasePath.replace(/\/+$/, "");
  const suffix = wildcard?.trim() ? `/${wildcard.replace(/^\/+/, "")}` : "";
  const search = location.search || "";
  const hash = location.hash || "";

  return <Navigate to={`${normalizedBasePath}${suffix}${search}${hash}`} replace />;
}
