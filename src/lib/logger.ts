const isDev = import.meta.env.DEV;

export const logger = {
  info(...args: unknown[]) {
    if (isDev) {
      console.info("[app]", ...args);
    }
  },

  warn(...args: unknown[]) {
    if (isDev) {
      console.warn("[app]", ...args);
    }
  },

  error(context: string, ...args: unknown[]) {
    if (isDev) {
      console.error(`[${context}]`, ...args);
    }
  },
};
