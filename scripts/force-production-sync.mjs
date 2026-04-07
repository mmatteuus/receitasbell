/* scripts/force-production-sync.mjs */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Carregar variáveis de ambiente de .env.production.local manualmente
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) {
          env[key] = val.replace(/^["']|["']$/g, '');
        }
      }
    });
    return env;
  } catch (e) {
    console.error("Erro ao carregar .env:", e.message);
    return {};
  }
}

const env = loadEnv(resolve('.env.production.local'));

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
    console.error("Faltam variáveis de ambiente críticas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY)!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeSecretKey);

async function syncRecipe(recipe, stripeAccountId) {
    console.log(`\n--- Sincronizando Receita: ${recipe.title} (ID: ${recipe.id}) ---`);
    console.log(`   Tenant ID: ${recipe.tenant_id} | Stripe Acct: ${stripeAccountId}`);

    try {
        let product;
        if (recipe.stripe_product_id) {
            try {
                product = await stripe.products.update(recipe.stripe_product_id, {
                    name: recipe.title,
                    description: recipe.description || undefined,
                    metadata: { tenantId: recipe.tenant_id, recipeId: recipe.id },
                }, { stripeAccount: stripeAccountId });
                console.log(`   ✅ Produto atualizado: ${product.id}`);
            } catch (e) {
                console.warn(`   ⚠️ Produto ${recipe.stripe_product_id} não encontrado ou erro de acesso. Criando novo.`);
            }
        }

        if (!product) {
            product = await stripe.products.create({
                name: recipe.title,
                description: recipe.description || undefined,
                metadata: { tenantId: recipe.tenant_id, recipeId: recipe.id },
            }, { stripeAccount: stripeAccountId });
            console.log(`   ✅ Produto criado: ${product.id}`);
        }

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(recipe.price_brl * 100),
            currency: 'brl',
            metadata: { tenantId: recipe.tenant_id, recipeId: recipe.id },
        }, { stripeAccount: stripeAccountId });
        console.log(`   ✅ Preço criado: ${price.id} (R$ ${recipe.price_brl})`);

        // Atualizar banco
        const { error: upError } = await supabase
            .from('recipes')
            .update({
                stripe_product_id: product.id,
                stripe_price_id: price.id,
                stripe_sync_status: 'synced',
                stripe_last_synced_at: new Date().toISOString()
            })
            .eq('id', recipe.id);

        if (upError) throw upError;
        console.log("   ✅ Banco de dados atualizado!");
        return true;
    } catch (error) {
        console.error(`   ❌ ERRO ao sincronizar ${recipe.title}:`, error.message);
        return false;
    }
}

async function main() {
    console.log(">>> INICIANDO FORCE SYNC PRODUÇÃO <<<");

    // 1. Obter contas connect
    const { data: accounts, error: acError } = await supabase
        .from('stripe_connect_accounts')
        .select('*');

    if (acError) throw acError;
    const accountMap = new Map(accounts.map(a => [a.tenant_id, a.stripe_account_id]));

    // 2. Obter receitas pagas pendentes
    const { data: recipes, error: reError } = await supabase
        .from('recipes')
        .select('*')
        .eq('access_tier', 'paid')
        .eq('stripe_sync_status', 'pending');

    if (reError) throw reError;
    console.log(`📝 Total para processar: ${recipes.length}`);

    let successCount = 0;
    for (const recipe of recipes) {
        // Garantir que temos um preço (se for null, pulamos)
        if (!recipe.price_brl) {
            console.warn(`⚠️ Pulando ${recipe.title}: preço nulo.`);
            continue;
        }

        const stripeAccountId = accountMap.get(recipe.tenant_id);
        if (!stripeAccountId) {
            console.warn(`⚠️ Pulando ${recipe.title}: Tenant sem conta Stripe Connect.`);
            continue;
        }

        const ok = await syncRecipe(recipe, stripeAccountId);
        if (ok) successCount++;
    }

    console.log(`\n================================`);
    console.log(`Sincronização concluída: ${successCount}/${recipes.length} com sucesso.`);
    console.log(`================================`);
    
    // Aguardar 2 segundos para o Node limpar handles de rede no Windows
    setTimeout(() => {
        process.exit(0);
    }, 2000);
}

main().catch(error => {
    console.error("❌ ERRO FATAL:", error);
    process.exit(1);
});
