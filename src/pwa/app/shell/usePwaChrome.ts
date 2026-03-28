import { useMemo } from "react";
import { resolvePwaRouteMeta } from "@/pwa/app/shell/pwa-route-meta";

export function usePwaChrome(pathname: string) {
  return useMemo(() => {
    const meta = resolvePwaRouteMeta(pathname);
    return {
      title: meta.title,
      showBack: !meta.isRoot,
      isRoot: meta.isRoot,
      normalizedPathname: meta.normalizedPathname,
    };
  }, [pathname]);
}
