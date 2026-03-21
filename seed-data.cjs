const email = "mtsf26@gmail.com";
const password = "4eKPZ2vEwQst4AD";
const baseUrl = "https://api.baserow.io";
const token = "wISEMSmnTmZkNTzxRFeZw9WmnNi0pZQd";
const tenantId = "3"; // ID do tenant localhost criado anteriormente

const TABLES = {
  CATEGORIES: 896977,
  RECIPES: 896978,
  SETTINGS: 896976,
};

async function run() {
  try {
    console.log("Iniciando semeadura de dados...");

    // 1. Criar Categorias
    const categories = [
      { name: "Sobremesas", slug: "sobremesas", description: "Doces e delícias", tenantId },
      { name: "Pratos Principais", slug: "pratos-principais", description: "Refeições completas", tenantId }
    ];

    for (const cat of categories) {
      console.log(`Criando categoria: ${cat.name}`);
      await fetch(`${baseUrl}/api/database/rows/table/${TABLES.CATEGORIES}/?user_field_names=true`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cat)
      });
    }

    // 2. Criar Receitas
    const recipes = [
      {
        title: "Bolo de Chocolate Húmido",
        slug: "bolo-de-chocolate-humido",
        description: "Um bolo irresistível e fácil de fazer.",
        status: "published",
        categoryId: "sobremesas",
        prep_time: 15,
        cook_time: 40,
        servings: 10,
        diff: "Fácil",
        kcal: 350,
        access_tier: "free",
        tenantId,
        full_ingredients_json: JSON.stringify(["2 xícaras de açúcar", "1 xícara de cacau", "3 ovos"]),
        full_instructions_json: JSON.stringify(["Misture tudo", "Asse por 40min"])
      },
      {
        title: "Lasanha de Berinjela",
        slug: "lasanha-de-berinjela",
        description: "Uma opção saudável e deliciosa.",
        status: "published",
        categoryId: "pratos-principais",
        prep_time: 20,
        cook_time: 45,
        servings: 6,
        diff: "Médio",
        kcal: 250,
        access_tier: "free",
        tenantId,
        full_ingredients_json: JSON.stringify(["3 berinjelas", "Molho de tomate", "Queijo branco"]),
        full_instructions_json: JSON.stringify(["Fatie as berinjelas", "Monte as camadas", "Leve ao forno"])
      }
    ];

    for (const rec of recipes) {
      console.log(`Criando receita: ${rec.title}`);
      await fetch(`${baseUrl}/api/database/rows/table/${TABLES.RECIPES}/?user_field_names=true`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(rec)
      });
    }

    // 3. Criar Configurações Padrão
    const settings = [
      { key: "app_name", value: "Minhas Receitas", tenantId },
      { key: "primary_color", value: "#ff6b6b", tenantId },
      { key: "payment_mode", value: "mock", tenantId }
    ];

    for (const set of settings) {
      console.log(`Criando configuração: ${set.key}`);
      await fetch(`${baseUrl}/api/database/rows/table/${TABLES.SETTINGS}/?user_field_names=true`, {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(set)
      });
    }

    console.log("Dados de teste criados com sucesso!");
  } catch (err) {
    console.error("Erro ao semear dados:", err);
  }
}

run();
