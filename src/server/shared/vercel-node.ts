import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

export type VercelRequest = IncomingMessage & {
  body?: unknown;
  cookies?: Record<string, string>;
  headers: IncomingHttpHeaders;
  method?: string;
  query: Record<string, string | string[] | undefined>;
  url?: string;
};

export type VercelResponse = ServerResponse & {
  json(body: unknown): VercelResponse;
  redirect(statusOrUrl: number | string, url?: string): VercelResponse;
  send(body: unknown): VercelResponse;
  status(code: number): VercelResponse;
};
