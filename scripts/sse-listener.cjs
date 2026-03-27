#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const { URL } = require('url');

function usage() {
  console.error('Uso: node scripts/sse-listener.cjs <SSE_URL> [OUT_FILE]');
  console.error('Ou defina SSE_URL e SSE_OUT e opcionalmente SSE_HEADERS (JSON) no ambiente.');
  process.exit(1);
}

const sseUrl = process.argv[2] || process.env.SSE_URL;
if (!sseUrl) usage();
const outFile = process.argv[3] || process.env.SSE_OUT || 'sse-events.jsonl';

let extraHeaders = {};
if (process.env.SSE_HEADERS) {
  try { extraHeaders = JSON.parse(process.env.SSE_HEADERS); } catch (e) { console.error('SSE_HEADERS não é JSON válido'); process.exit(1); }
}

const urlObj = new URL(sseUrl);
const isHttps = urlObj.protocol === 'https:';

const options = {
  method: 'GET',
  headers: Object.assign({ 'Accept': 'text/event-stream' }, extraHeaders),
};

const client = isHttps ? https : http;

console.log('Conectando a', sseUrl);

const req = client.request(sseUrl, options, (res) => {
  if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
    console.error('Resposta não OK da origem SSE:', res.statusCode);
    res.pipe(process.stdout);
    return;
  }

  res.setEncoding('utf8');
  let buf = '';

  res.on('data', (chunk) => {
    buf += chunk;
    let parts = buf.split(/\r?\n\r?\n/);
    buf = parts.pop();
    for (const part of parts) {
      if (!part.trim()) continue;
      const lines = part.split(/\r?\n/);
      let event = 'message';
      let dataLines = [];
      for (const line of lines) {
        if (line.startsWith(':')) continue;
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      const dataText = dataLines.join('\n');
      let parsed = dataText;
      try { parsed = JSON.parse(dataText); } catch (e) { }
      const outObj = { timestamp: new Date().toISOString(), event, data: parsed };
      try {
        fs.appendFileSync(outFile, JSON.stringify(outObj) + '\n');
      } catch (e) {
        console.error('Erro escrevendo arquivo:', e);
      }
      console.log('evento salvo:', event);
    }
  });

  res.on('end', () => console.log('Conexão SSE encerrada'));
});

req.on('error', (err) => {
  console.error('Erro na requisição:', err && err.message ? err.message : err);
});

req.end();
