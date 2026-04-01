import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

export interface VercelRequest extends IncomingMessage {
  body?: unknown;
  cookies?: Record<string, string>;
  headers: IncomingHttpHeaders;
  method?: string;
  query: Record<string, string | string[] | undefined>;
  url?: string;
}

export interface VercelResponse extends ServerResponse {
  json(body: unknown): this;
  redirect(statusOrUrl: number | string, url?: string): this;
  send(body: unknown): this;
  status(code: number): this;
}
