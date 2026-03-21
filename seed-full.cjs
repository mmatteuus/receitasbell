const email = "mtsf26@gmail.com";
const password = "4eKPZ2vEwQst4AD";
const baseUrl = "https://api.baserow.io";
const token = "wISEMSmnTmZkNTzxRFeZw9WmnNi0pZQd";
const tenantId = "3"; // ID do tenant localhost

const TABLES = {
  CATEGORIES: 896977,
  RECIPES: 896978,
  SETTINGS: 896976,
};

async function postRow(tableId, data) {
  const res = await fetch(`${baseUrl}/api/database/rows/table/${tableId}/?user_field_names=true`, {
    method: "POST",
    headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function run() {
  try {
    console.log("Populando catálogo real...");

    // 1. Categorias Adicionais
    const categories = [
        { name: "Café da Manhã", slug: "cafe-da-manha", description: "Comece o dia com energia", tenantId },
        { name: "Lanches Rápidos", slug: "lanches-rapidos", description: "Praticidade para o dia a dia", tenantId },
        { name: "Bebidas & Drinks", slug: "bebidas", description: "Refrescos e coquetéis", tenantId },
        { name: "Saudável / Fit", slug: "saudavel", description: "Equilíbrio e sabor", tenantId }
    ];
    for (const cat of categories) await postRow(TABLES.CATEGORIES, cat);

    // 2. Receitas Adicionais
    const recipes = [
        {
            title: "Tapioca com Queijo e Tomate",
            slug: "tapioca-queijo-tomate",
            description: "Clássica, rápida e deliciosa.",
            status: "published",
            categoryId: "cafe-da-manha",
            prep_time: 5,
            cook_time: 5,
            servings: 1,
            diff: "Fácil",
            kcal: 180,
            access_tier: "free",
            tenantId,
            full_ingredients_json: JSON.stringify(["Massa de tapioca", "Queijo coalho", "Tomate cereja"]),
            full_instructions_json: JSON.stringify(["Aqueça a frigideira", "Coloque a massa", "Adicione o recheio", "Dobre ao meio"])
        },
        {
            title: "Suco Verde Detox",
            slug: "suco-verde-detox",
            description: "Para limpar o organismo.",
            status: "published",
            categoryId: "bebidas",
            prep_time: 5,
            cook_time: 0,
            servings: 2,
            diff: "Fácil",
            kcal: 90,
            access_tier: "free",
            tenantId,
            full_ingredients_json: JSON.stringify(["Couve", "Maçã", "Gengibre", "Limão"]),
            full_instructions_json: JSON.stringify(["Bata tudo no liquidificador", "Coar se preferir", "Sirva gelado"])
        },
        {
            title: "Risoto de Cogumelos",
            slug: "risoto-cogumelos",
            description: "Um prato sofisticado para ocasiões especiais.",
            status: "published",
            categoryId: "pratos-principais",
            prep_time: 15,
            cook_time: 25,
            servings: 4,
            diff: "Médio",
            kcal: 420,
            access_tier: "premium",
            price_brl: 29.90,
            tenantId,
            full_ingredients_json: JSON.stringify(["Arroz arbóreo", "Shitake", "Vinho branco", "Parmesão"]),
            full_instructions_json: JSON.stringify(["Refogue a cebola", "Adicione o arroz", "Vá colocando o caldo aos poucos", "Finalize com queijo e manteiga"])
        }
    ];
    for (const rec of recipes) await postRow(TABLES.RECIPES, rec);

    console.log("Catálogo expandido com sucesso!");
  } catch (err) {
    console.error(err);
  }
}

run();
