const baseUrl = "https://api.baserow.io";
const token = "wISEMSmnTmZkNTzxRFeZw9WmnNi0pZQd";
const TABLE_ID = 896978;

async function run() {
  try {
    const res = await fetch(`${baseUrl}/api/database/rows/table/${TABLE_ID}/?user_field_names=true`, {
      headers: { "Authorization": `Token ${token}` }
    });
    const data = await res.json();
    const recipes = data.results;

    const updates = {
      "bolo-de-chocolate-humido": "/images/bolo-de-chocolate-humido.png",
      "lasanha-de-berinjela": "/images/lasanha-de-berinjela.png",
      "tapioca-queijo-tomate": "/images/tapioca-queijo-tomate.png",
      "suco-verde-detox": "/images/suco-verde-detox.png",
      "risoto-cogumelos": "/images/risoto-cogumelos.png"
    };

    for (const recipe of recipes) {
      const newImage = updates[recipe.slug];
      if (newImage) {
        console.log(`Atualizando imagem da receita '${recipe.title}' para ${newImage}`);
        await fetch(`${baseUrl}/api/database/rows/table/${TABLE_ID}/${recipe.id}/?user_field_names=true`, {
          method: "PATCH",
          headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ image: newImage })
        });
      }
    }
    console.log("Todas as imagens foram atualizadas com sucesso!");
  } catch (err) {
    console.error("Erro na atualização:", err);
  }
}

run();
