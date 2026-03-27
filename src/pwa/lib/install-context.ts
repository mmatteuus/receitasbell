const INSTALL_CONTEXT_KEY = 'pwa_install_context';

export type InstallContext = 'user' | 'admin';

export function setInstallContext(context: InstallContext) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(INSTALL_CONTEXT_KEY, context);
  }
}

export function getInstallContext(): InstallContext {
  if (typeof window === 'undefined') return 'user';
  return (localStorage.getItem(INSTALL_CONTEXT_KEY) as InstallContext) || 'user';
}

export function clearInstallContext() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INSTALL_CONTEXT_KEY);
  }
}
