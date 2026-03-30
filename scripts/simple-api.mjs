import http from 'node:http';
import { supabaseAdmin } from '../src/server/integrations/supabase/client.js';
import { listRecipes } from '../src/server/recipes/repo.js';

const PORT = 3000;
const TENANT_ID = '98123fde-012f-5ff3-8b50-881449dac91a';

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url?.includes('/api/public/catalog')) {
    try {
      const recipes = await listRecipes(TENANT_ID);
      res.writeHead(200);
      res.end(JSON.stringify({ recipes, items: recipes, meta: { total: recipes.length } }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found in simple-api' }));
});

server.listen(PORT, () => {
  console.log(`Simple API Mirror listening on port ${PORT}`);
});
