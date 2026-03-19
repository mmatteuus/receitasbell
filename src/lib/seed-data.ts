import type { RecipeRecord } from "@/lib/recipes/types";

export const seedRecipes: RecipeRecord[] = [
  {
    id: "seed-1",
    slug: "bolo-de-cenoura",
    title: "Bolo de Cenoura com Cobertura de Chocolate",
    description: "O clássico bolo de cenoura brasileiro com uma cobertura de chocolate cremosa e irresistível.",
    imageUrl: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&auto=format",
    categorySlug: "bolos",
    tags: ["clássico", "fácil"],
    status: "published",
    prepTime: 20, cookTime: 40, totalTime: 60, servings: 10,
    accessTier: "free",
    fullIngredients: [
      "3 cenouras médias", "4 ovos", "1 xícara de óleo", "2 xícaras de açúcar",
      "2 e 1/2 xícaras de farinha de trigo", "1 colher de sopa de fermento em pó"
    ],
    fullInstructions: [
      "Bata no liquidificador as cenouras, os ovos e o óleo.",
      "Acrescente o açúcar e bata novamente.",
      "Em uma tigela, misture a farinha e o fermento.",
      "Despeje a mistura do liquidificador sobre os secos e mexa delicadamente.",
      "Asse em forno pré-aquecido a 180°C por 40 minutos.",
      "Para a cobertura: derreta 3 colheres de chocolate em pó com 1 colher de manteiga e 3 colheres de leite."
    ],
    createdAt: "2025-01-15T10:00:00Z", updatedAt: "2025-01-15T10:00:00Z", publishedAt: "2025-01-15T10:00:00Z"
  },
  {
    id: "seed-2",
    slug: "pao-de-queijo",
    title: "Pão de Queijo Mineiro",
    description: "Receita tradicional de pão de queijo mineiro, crocante por fora e macio por dentro.",
    imageUrl: "https://images.unsplash.com/photo-1598142982901-df6cec890385?w=800&auto=format",
    categorySlug: "salgadas",
    tags: ["mineiro", "tradicional"],
    status: "published",
    prepTime: 15, cookTime: 25, totalTime: 40, servings: 20,
    accessTier: "free",
    fullIngredients: [
      "500g de polvilho azedo", "1 xícara de leite", "1/2 xícara de óleo",
      "2 ovos", "200g de queijo minas curado ralado", "1 colher de chá de sal"
    ],
    fullInstructions: [
      "Ferva o leite com o óleo e o sal.",
      "Despeje sobre o polvilho e misture bem.",
      "Quando esfriar, adicione os ovos e o queijo.",
      "Modele bolinhas e coloque em assadeira untada.",
      "Asse a 200°C por 25 minutos ou até dourar."
    ],
    createdAt: "2025-01-20T10:00:00Z", updatedAt: "2025-01-20T10:00:00Z", publishedAt: "2025-01-20T10:00:00Z"
  },
  {
    id: "seed-3",
    slug: "brigadeiro-gourmet",
    title: "Brigadeiro Gourmet de Pistache",
    description: "Uma versão sofisticada do brigadeiro tradicional, feito com pasta de pistache importada e chocolate belga.",
    imageUrl: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&auto=format",
    categorySlug: "doces",
    tags: ["gourmet", "premium", "pistache"],
    status: "published",
    prepTime: 30, cookTime: 20, totalTime: 50, servings: 30,
    accessTier: "paid",
    priceBRL: 9.90,
    fullIngredients: [
      "1 lata de leite condensado", "100g de pasta de pistache importada",
      "150g de chocolate belga branco picado", "2 colheres de manteiga sem sal",
      "1 colher de creme de leite fresco", "Pistache triturado para decorar", "Raspas de chocolate branco"
    ],
    fullInstructions: [
      "Derreta o chocolate belga branco em banho-maria a 45°C.",
      "Em outra panela, aqueça o leite condensado com a manteiga em fogo baixo.",
      "Adicione a pasta de pistache e mexa sem parar por 5 minutos.",
      "Incorpore o chocolate branco derretido ao brigadeiro.",
      "Acrescente o creme de leite e mexa até desgrudar da panela.",
      "Deixe esfriar em prato untado por 2 horas na geladeira.",
      "Modele bolinhas e passe no pistache triturado.",
      "Finalize com raspas de chocolate branco."
    ],
    createdAt: "2025-02-01T10:00:00Z", updatedAt: "2025-02-01T10:00:00Z", publishedAt: "2025-02-01T10:00:00Z"
  },
  {
    id: "seed-4",
    slug: "risoto-de-cogumelos",
    title: "Risoto de Cogumelos Selvagens com Trufa",
    description: "Um risoto cremoso e aromático com mix de cogumelos selvagens e azeite trufado, digno de restaurante estrelado.",
    imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&auto=format",
    categorySlug: "massas",
    tags: ["gourmet", "premium", "italiano"],
    status: "published",
    prepTime: 15, cookTime: 35, totalTime: 50, servings: 4,
    accessTier: "paid",
    priceBRL: 14.90,
    fullIngredients: [
      "300g de arroz arbório", "200g de cogumelos shimeji", "150g de cogumelos shiitake",
      "100g de cogumelos paris", "1 litro de caldo de legumes quente", "1 cebola picada finamente",
      "2 dentes de alho picados", "150ml de vinho branco seco", "80g de parmesão ralado",
      "3 colheres de manteiga gelada", "2 colheres de azeite trufado", "Sal e pimenta do reino a gosto",
      "Cebolinha para finalizar"
    ],
    fullInstructions: [
      "Limpe e fatie os cogumelos. Separe os talos para o caldo.",
      "Refogue os cogumelos em azeite com alho até dourar. Reserve.",
      "Na mesma panela, refogue a cebola em manteiga até translúcida.",
      "Adicione o arroz e toste por 2 minutos.",
      "Deglaceie com o vinho branco e mexa até evaporar.",
      "Adicione o caldo aos poucos, uma concha por vez, mexendo sempre.",
      "Quando o arroz estiver al dente (cerca de 18 min), desligue o fogo.",
      "Faça a mantecare: adicione o parmesão e a manteiga gelada em cubos.",
      "Mexa vigorosamente para criar a cremosidade.",
      "Monte: coloque o risoto no prato, cogumelos por cima.",
      "Finalize com azeite trufado e cebolinha."
    ],
    createdAt: "2025-02-05T10:00:00Z", updatedAt: "2025-02-05T10:00:00Z", publishedAt: "2025-02-05T10:00:00Z"
  },
  {
    id: "seed-5",
    slug: "suco-verde-detox",
    title: "Suco Verde Detox",
    description: "Suco refrescante e nutritivo para começar o dia com energia e disposição.",
    imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&auto=format",
    categorySlug: "bebidas",
    tags: ["saudável", "rápido"],
    status: "published",
    prepTime: 5, cookTime: 0, totalTime: 5, servings: 2,
    accessTier: "free",
    fullIngredients: [
      "1 maçã verde", "2 folhas de couve", "1/2 pepino",
      "Suco de 1 limão", "1 pedaço de gengibre", "200ml de água de coco"
    ],
    fullInstructions: [
      "Lave bem todos os ingredientes.",
      "Corte a maçã e o pepino em pedaços.",
      "Bata tudo no liquidificador com a água de coco.",
      "Coe se preferir e sirva gelado."
    ],
    createdAt: "2025-01-25T10:00:00Z", updatedAt: "2025-01-25T10:00:00Z", publishedAt: "2025-01-25T10:00:00Z"
  },
  {
    id: "seed-6",
    slug: "salada-mediterranea",
    title: "Salada Mediterrânea Completa",
    description: "Salada colorida e saudável com ingredientes frescos da dieta mediterrânea.",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format",
    categorySlug: "saudaveis",
    tags: ["saudável", "leve", "fit"],
    status: "published",
    prepTime: 15, cookTime: 0, totalTime: 15, servings: 2,
    accessTier: "free",
    fullIngredients: [
      "Mix de folhas verdes", "1 pepino", "Tomates cereja", "Azeitonas pretas",
      "Queijo feta", "Azeite extra virgem", "Suco de limão", "Orégano"
    ],
    fullInstructions: [
      "Lave e seque as folhas.",
      "Corte o pepino em rodelas e os tomates ao meio.",
      "Monte a salada numa travessa.",
      "Esfarele o queijo feta por cima.",
      "Tempere com azeite, limão, orégano, sal e pimenta."
    ],
    createdAt: "2025-01-28T10:00:00Z", updatedAt: "2025-01-28T10:00:00Z", publishedAt: "2025-01-28T10:00:00Z"
  },
  {
    id: "seed-7",
    slug: "macarrao-carbonara-autentico",
    title: "Carbonara Autêntica Italiana",
    description: "A verdadeira receita romana de carbonara, sem creme de leite, com guanciale e pecorino romano.",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&auto=format",
    categorySlug: "massas",
    tags: ["italiano", "premium", "autêntico"],
    status: "published",
    prepTime: 10, cookTime: 15, totalTime: 25, servings: 2,
    accessTier: "paid",
    priceBRL: 7.90,
    fullIngredients: [
      "200g de spaghetti ou rigatoni", "150g de guanciale em cubos",
      "4 gemas de ovo caipira", "1 ovo inteiro",
      "80g de pecorino romano DOP ralado fino", "Pimenta do reino moída na hora",
      "Sal para a água da massa"
    ],
    fullInstructions: [
      "Cozinhe a massa em água bem salgada até 1 minuto antes do al dente.",
      "Enquanto isso, frite o guanciale em fogo médio-baixo na própria gordura.",
      "Em uma tigela, misture as gemas, o ovo inteiro e o pecorino. Reserve.",
      "Quando o guanciale estiver crocante, retire do fogo.",
      "Escorra a massa reservando 1 xícara da água do cozimento.",
      "Adicione a massa à panela do guanciale (fogo DESLIGADO).",
      "Despeje a mistura de ovos e mexa rapidamente com um pegador.",
      "Adicione água da massa aos poucos para atingir a cremosidade.",
      "A temperatura residual cozinha os ovos sem virar mexido.",
      "Sirva imediatamente com mais pecorino e pimenta."
    ],
    createdAt: "2025-02-10T10:00:00Z", updatedAt: "2025-02-10T10:00:00Z", publishedAt: "2025-02-10T10:00:00Z"
  },
  {
    id: "seed-8",
    slug: "bolo-de-fuba-cremoso",
    title: "Bolo de Fubá Cremoso",
    description: "Bolo de fubá com textura cremosa no centro, perfeito para o café da tarde.",
    imageUrl: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format",
    categorySlug: "bolos",
    tags: ["caseiro", "fácil"],
    status: "published",
    prepTime: 10, cookTime: 45, totalTime: 55, servings: 8,
    accessTier: "free",
    fullIngredients: [
      "3 ovos", "2 xícaras de leite", "1 xícara de fubá", "1 xícara de açúcar",
      "3 colheres de farinha de trigo", "2 colheres de manteiga", "1 colher de fermento"
    ],
    fullInstructions: [
      "Bata tudo no liquidificador por 3 minutos.",
      "Despeje em forma untada e enfarinhada.",
      "Asse a 180°C por 45 minutos.",
      "Deixe esfriar antes de desenformar."
    ],
    createdAt: "2025-02-12T10:00:00Z", updatedAt: "2025-02-12T10:00:00Z", publishedAt: "2025-02-12T10:00:00Z"
  },
  {
    id: "seed-9",
    slug: "tiramisu-classico",
    title: "Tiramisù Clássico Italiano",
    description: "A autêntica sobremesa italiana com camadas de biscoito champagne, café espresso e creme de mascarpone.",
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format",
    categorySlug: "doces",
    tags: ["gourmet", "premium", "italiano"],
    status: "published",
    prepTime: 40, cookTime: 0, totalTime: 240, servings: 8,
    accessTier: "paid",
    priceBRL: 12.90,
    fullIngredients: [
      "500g de mascarpone italiano", "6 gemas de ovo caipira", "150g de açúcar refinado",
      "300ml de café espresso forte (frio)", "3 colheres de licor Amaretto", "400g de biscoitos Savoiardi",
      "Cacau em pó amargo para polvilhar", "Raspas de chocolate amargo 70%"
    ],
    fullInstructions: [
      "Bata as gemas com o açúcar até obter um creme claro e volumoso (10 min).",
      "Adicione o mascarpone aos poucos, mexendo delicadamente.",
      "Misture o café frio com o licor Amaretto.",
      "Mergulhe rapidamente cada biscoito no café (não encharcar).",
      "Monte uma camada de biscoitos no fundo de uma travessa.",
      "Cubra com metade do creme de mascarpone.",
      "Repita: biscoitos + creme.",
      "Leve à geladeira por no mínimo 4 horas (ideal 12h).",
      "Antes de servir, polvilhe cacau amargo e raspas de chocolate."
    ],
    createdAt: "2025-02-15T10:00:00Z", updatedAt: "2025-02-15T10:00:00Z", publishedAt: "2025-02-15T10:00:00Z"
  },
  {
    id: "seed-10",
    slug: "ramen-japones-tonkotsu",
    title: "Ramen Tonkotsu com Chashu",
    description: "Ramen japonês autêntico com caldo cremoso de ossos de porco cozido por 12 horas e barriga de porco caramelizada.",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format",
    categorySlug: "salgadas",
    tags: ["gourmet", "premium", "japonês"],
    status: "published",
    prepTime: 60, cookTime: 720, totalTime: 780, servings: 4,
    accessTier: "paid",
    priceBRL: 19.90,
    fullIngredients: [
      "1kg de ossos de porco (joelho e espinha)", "500g de barriga de porco inteira",
      "200ml de molho de soja", "100ml de mirin", "4 ovos caipira (para ajitsuke tamago)",
      "400g de macarrão ramen fresco", "4 dentes de alho", "Gengibre fresco 5cm",
      "Cebolinha, nori e gergelim para finalizar", "Óleo de gergelim torrado"
    ],
    fullInstructions: [
      "Branqueie os ossos em água fervente por 10 min, descarte a água.",
      "Cubra os ossos com água limpa e cozinhe em fogo alto por 1h sem tampa.",
      "Reduza para fogo médio e cozinhe por mais 11h, adicionando água conforme necessário.",
      "O caldo deve ficar branco e cremoso (emulsão de colágeno).",
      "Para o chashu: enrole a barriga de porco e amarre. Sele em panela quente.",
      "Cozinhe o chashu no molho de soja + mirin + alho por 2h em fogo baixo.",
      "Cozinhe os ovos por 6min30s (gema mole), descasque e marine no molho do chashu por 4h.",
      "Cozinhe o macarrão conforme instruções (geralmente 2 min).",
      "Monte: caldo no bowl, macarrão, fatias de chashu, ovo marinado partido ao meio.",
      "Finalize com cebolinha, nori, gergelim e gotas de óleo de gergelim."
    ],
    createdAt: "2025-02-18T10:00:00Z", updatedAt: "2025-02-18T10:00:00Z", publishedAt: "2025-02-18T10:00:00Z"
  },
  {
    id: "seed-11",
    slug: "cheesecake-ny-style",
    title: "Cheesecake New York Style com Calda de Frutas Vermelhas",
    description: "O cheesecake cremoso estilo Nova York com base crocante de biscoito e calda artesanal de frutas vermelhas.",
    imageUrl: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&auto=format",
    categorySlug: "doces",
    tags: ["gourmet", "premium", "americano"],
    status: "published",
    prepTime: 30, cookTime: 60, totalTime: 360, servings: 12,
    accessTier: "paid",
    priceBRL: 11.90,
    fullIngredients: [
      "800g de cream cheese temperatura ambiente", "200g de açúcar", "5 ovos grandes",
      "200ml de creme de leite fresco", "1 colher de extrato de baunilha",
      "200g de biscoito tipo digestive", "80g de manteiga derretida",
      "200g de mix de frutas vermelhas (morango, framboesa, mirtilo)", "3 colheres de açúcar para calda",
      "Suco de meio limão"
    ],
    fullInstructions: [
      "Triture os biscoitos e misture com a manteiga derretida.",
      "Forre o fundo de uma forma de 23cm com fundo removível. Leve à geladeira 30 min.",
      "Bata o cream cheese com o açúcar até ficar liso (não incorporar ar).",
      "Adicione os ovos um a um, batendo em velocidade baixa.",
      "Acrescente o creme de leite e a baunilha.",
      "Despeje sobre a base e asse a 160°C por 60 min (centro levemente tremido).",
      "Desligue o forno e deixe o cheesecake dentro por 1h com a porta entreaberta.",
      "Leve à geladeira por no mínimo 4 horas.",
      "Calda: cozinhe as frutas com açúcar e limão por 10 min até engrossar.",
      "Sirva o cheesecake com a calda por cima."
    ],
    createdAt: "2025-02-20T10:00:00Z", updatedAt: "2025-02-20T10:00:00Z", publishedAt: "2025-02-20T10:00:00Z"
  },
  {
    id: "seed-12",
    slug: "paella-valenciana",
    title: "Paella Valenciana Autêntica",
    description: "A tradicional paella espanhola com frutos do mar, açafrão legítimo e arroz bomba cozido na paellera.",
    imageUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&auto=format",
    categorySlug: "salgadas",
    tags: ["gourmet", "premium", "espanhol"],
    status: "published",
    prepTime: 30, cookTime: 45, totalTime: 75, servings: 6,
    accessTier: "paid",
    priceBRL: 16.90,
    fullIngredients: [
      "400g de arroz bomba (ou arbório)", "300g de camarões grandes limpos",
      "300g de lula em anéis", "500g de mexilhões limpos", "1 pimentão vermelho em tiras",
      "200g de ervilhas frescas", "4 dentes de alho picados", "2 tomates ralados",
      "1 pitada generosa de açafrão em fios", "1,2L de caldo de peixe quente",
      "Azeite de oliva extra virgem", "Limão siciliano para servir"
    ],
    fullInstructions: [
      "Aqueça azeite na paellera e refogue os frutos do mar. Reserve.",
      "No mesmo azeite, refogue o alho, pimentão e tomate por 5 min.",
      "Adicione o arroz e toste por 2 minutos, mexendo.",
      "Dissolva o açafrão no caldo quente e despeje sobre o arroz.",
      "Distribua uniformemente e NÃO mexa mais a partir daqui.",
      "Cozinhe em fogo alto por 5 min, depois médio por 15 min.",
      "Adicione os frutos do mar e as ervilhas nos últimos 5 min.",
      "Quando ouvir o arroz crepitar no fundo (socarrat), desligue.",
      "Cubra com pano limpo e descanse 5 min antes de servir.",
      "Sirva com fatias de limão siciliano."
    ],
    createdAt: "2025-02-22T10:00:00Z", updatedAt: "2025-02-22T10:00:00Z", publishedAt: "2025-02-22T10:00:00Z"
  },
];

const SEED_VERSION = "v3"; // bump to force re-seed when new recipes are added

export function initSeedData() {
  const seeded = localStorage.getItem("rdb_seed_version");
  if (seeded !== SEED_VERSION) {
    localStorage.setItem("rdb_recipes_v2", JSON.stringify(seedRecipes));
    localStorage.setItem("rdb_seed_version", SEED_VERSION);
  }
}
