import { reportError, reportLog } from "@/lib/observability/report";

function toMessage(args: unknown[]) {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }
      if (typeof arg === "string") {
        return arg;
      }
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

export const logger = {
  info(...args: unknown[]) {
    reportLog("info", "app", {
      message: toMessage(args),
    });
  },

  warn(...args: unknown[]) {
    reportLog("warn", "app", {
      message: toMessage(args),
    });
  },

  error(context: string, ...args: unknown[]) {
    const firstError = args.find((arg): arg is Error => arg instanceof Error);

    if (firstError) {
      reportError(context, firstError, {
        message: toMessage(args.filter((arg) => arg !== firstError)),
      });
      return;
    }

    reportLog("error", context, {
      message: toMessage(args),
    });
  },
};
