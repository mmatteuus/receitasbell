import { Recipe } from "@/types/recipe";

export const seedRecipes: Recipe[] = [
  {
    id: "seed-1",
    slug: "bolo-de-cenoura",
    title: "Bolo de Cenoura com Cobertura de Chocolate",
    description: "O clássico bolo de cenoura brasileiro com uma cobertura de chocolate cremosa e irresistível.",
    image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&auto=format",
    categorySlug: "bolos",
    tags: ["clássico", "fácil"],
    status: "published",
    prepTime: 20,
    cookTime: 40,
    totalTime: 60,
    servings: 10,
    rating: 4.8,
    reviewsCount: 24,
    accessTier: "free",
    ingredients: [
      "3 cenouras médias",
      "4 ovos",
      "1 xícara de óleo",
      "2 xícaras de açúcar",
      "2 e 1/2 xícaras de farinha de trigo",
      "1 colher de sopa de fermento em pó"
    ],
    instructions: [
      "Bata no liquidificador as cenouras, os ovos e o óleo.",
      "Acrescente o açúcar e bata novamente.",
      "Em uma tigela, misture a farinha e o fermento.",
      "Despeje a mistura do liquidificador sobre os secos e mexa delicadamente.",
      "Asse em forno pré-aquecido a 180°C por 40 minutos.",
      "Para a cobertura: derreta 3 colheres de chocolate em pó com 1 colher de manteiga e 3 colheres de leite."
    ],
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
    publishedAt: "2025-01-15T10:00:00Z"
  },
  {
    id: "seed-2",
    slug: "pao-de-queijo",
    title: "Pão de Queijo Mineiro",
    description: "Receita tradicional de pão de queijo mineiro, crocante por fora e macio por dentro.",
    image: "https://images.unsplash.com/photo-1598142982901-df6cec890385?w=800&auto=format",
    categorySlug: "salgadas",
    tags: ["mineiro", "tradicional"],
    status: "published",
    prepTime: 15,
    cookTime: 25,
    totalTime: 40,
    servings: 20,
    rating: 4.9,
    reviewsCount: 42,
    accessTier: "free",
    ingredients: [
      "500g de polvilho azedo",
      "1 xícara de leite",
      "1/2 xícara de óleo",
      "2 ovos",
      "200g de queijo minas curado ralado",
      "1 colher de chá de sal"
    ],
    instructions: [
      "Ferva o leite com o óleo e o sal.",
      "Despeje sobre o polvilho e misture bem.",
      "Quando esfriar, adicione os ovos e o queijo.",
      "Modele bolinhas e coloque em assadeira untada.",
      "Asse a 200°C por 25 minutos ou até dourar."
    ],
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-01-20T10:00:00Z",
    publishedAt: "2025-01-20T10:00:00Z"
  },
  {
    id: "seed-3",
    slug: "brigadeiro-gourmet",
    title: "Brigadeiro Gourmet de Pistache",
    description: "Uma versão sofisticada do brigadeiro tradicional, feito com pasta de pistache importada e chocolate belga.",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&auto=format",
    categorySlug: "doces",
    tags: ["gourmet", "premium", "pistache"],
    status: "published",
    prepTime: 30,
    cookTime: 20,
    totalTime: 50,
    servings: 30,
    rating: 4.7,
    reviewsCount: 18,
    accessTier: "paid",
    priceCents: 990,
    currency: "BRL",
    teaserIngredients: [
      "1 lata de leite condensado",
      "Pasta de pistache importada",
      "Chocolate belga branco"
    ],
    teaserInstructions: [
      "Comece derretendo o chocolate belga em banho-maria...",
      "A técnica especial de temperagem é o segredo..."
    ],
    ingredients: [
      "1 lata de leite condensado",
      "100g de pasta de pistache importada",
      "150g de chocolate belga branco picado",
      "2 colheres de manteiga sem sal",
      "1 colher de creme de leite fresco",
      "Pistache triturado para decorar",
      "Raspas de chocolate branco"
    ],
    instructions: [
      "Derreta o chocolate belga branco em banho-maria a 45°C.",
      "Em outra panela, aqueça o leite condensado com a manteiga em fogo baixo.",
      "Adicione a pasta de pistache e mexa sem parar por 5 minutos.",
      "Incorpore o chocolate branco derretido ao brigadeiro.",
      "Acrescente o creme de leite e mexa até desgrudar da panela.",
      "Deixe esfriar em prato untado por 2 horas na geladeira.",
      "Modele bolinhas e passe no pistache triturado.",
      "Finalize com raspas de chocolate branco."
    ],
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
    publishedAt: "2025-02-01T10:00:00Z"
  },
  {
    id: "seed-4",
    slug: "risoto-de-cogumelos",
    title: "Risoto de Cogumelos Selvagens com Trufa",
    description: "Um risoto cremoso e aromático com mix de cogumelos selvagens e azeite trufado, digno de restaurante estrelado.",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&auto=format",
    categorySlug: "massas",
    tags: ["gourmet", "premium", "italiano"],
    status: "published",
    prepTime: 15,
    cookTime: 35,
    totalTime: 50,
    servings: 4,
    rating: 4.9,
    reviewsCount: 31,
    accessTier: "paid",
    priceCents: 1490,
    currency: "BRL",
    teaserIngredients: [
      "300g de arroz arbório",
      "Mix de cogumelos (shimeji, shiitake, paris)",
      "Azeite trufado"
    ],
    teaserInstructions: [
      "O segredo está no caldo de cogumelos caseiro...",
      "A técnica de mantecare italiana faz toda diferença..."
    ],
    ingredients: [
      "300g de arroz arbório",
      "200g de cogumelos shimeji",
      "150g de cogumelos shiitake",
      "100g de cogumelos paris",
      "1 litro de caldo de legumes quente",
      "1 cebola picada finamente",
      "2 dentes de alho picados",
      "150ml de vinho branco seco",
      "80g de parmesão ralado",
      "3 colheres de manteiga gelada",
      "2 colheres de azeite trufado",
      "Sal e pimenta do reino a gosto",
      "Cebolinha para finalizar"
    ],
    instructions: [
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
    createdAt: "2025-02-05T10:00:00Z",
    updatedAt: "2025-02-05T10:00:00Z",
    publishedAt: "2025-02-05T10:00:00Z"
  },
  {
    id: "seed-5",
    slug: "suco-verde-detox",
    title: "Suco Verde Detox",
    description: "Suco refrescante e nutritivo para começar o dia com energia e disposição.",
    image: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&auto=format",
    categorySlug: "bebidas",
    tags: ["saudável", "rápido"],
    status: "published",
    prepTime: 5,
    cookTime: 0,
    totalTime: 5,
    servings: 2,
    rating: 4.3,
    reviewsCount: 15,
    accessTier: "free",
    ingredients: [
      "1 maçã verde",
      "2 folhas de couve",
      "1/2 pepino",
      "Suco de 1 limão",
      "1 pedaço de gengibre",
      "200ml de água de coco"
    ],
    instructions: [
      "Lave bem todos os ingredientes.",
      "Corte a maçã e o pepino em pedaços.",
      "Bata tudo no liquidificador com a água de coco.",
      "Coe se preferir e sirva gelado."
    ],
    createdAt: "2025-01-25T10:00:00Z",
    updatedAt: "2025-01-25T10:00:00Z",
    publishedAt: "2025-01-25T10:00:00Z"
  },
  {
    id: "seed-6",
    slug: "salada-mediterranea",
    title: "Salada Mediterrânea Completa",
    description: "Salada colorida e saudável com ingredientes frescos da dieta mediterrânea.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format",
    categorySlug: "saudaveis",
    tags: ["saudável", "leve", "fit"],
    status: "published",
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    servings: 2,
    rating: 4.5,
    reviewsCount: 12,
    accessTier: "free",
    ingredients: [
      "Mix de folhas verdes",
      "1 pepino",
      "Tomates cereja",
      "Azeitonas pretas",
      "Queijo feta",
      "Azeite extra virgem",
      "Suco de limão",
      "Orégano"
    ],
    instructions: [
      "Lave e seque as folhas.",
      "Corte o pepino em rodelas e os tomates ao meio.",
      "Monte a salada numa travessa.",
      "Esfarele o queijo feta por cima.",
      "Tempere com azeite, limão, orégano, sal e pimenta."
    ],
    createdAt: "2025-01-28T10:00:00Z",
    updatedAt: "2025-01-28T10:00:00Z",
    publishedAt: "2025-01-28T10:00:00Z"
  },
  {
    id: "seed-7",
    slug: "macarrao-carbonara-autentico",
    title: "Carbonara Autêntica Italiana",
    description: "A verdadeira receita romana de carbonara, sem creme de leite, com guanciale e pecorino romano.",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&auto=format",
    categorySlug: "massas",
    tags: ["italiano", "premium", "autêntico"],
    status: "published",
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    servings: 2,
    rating: 4.8,
    reviewsCount: 27,
    accessTier: "paid",
    priceCents: 790,
    currency: "BRL",
    teaserIngredients: [
      "200g de spaghetti ou rigatoni",
      "Guanciale (bochecha de porco curada)",
      "Pecorino Romano DOP"
    ],
    teaserInstructions: [
      "A técnica do creaminess sem creme de leite é o segredo...",
      "O controle de temperatura ao misturar os ovos é crucial..."
    ],
    ingredients: [
      "200g de spaghetti ou rigatoni",
      "150g de guanciale em cubos",
      "4 gemas de ovo caipira",
      "1 ovo inteiro",
      "80g de pecorino romano DOP ralado fino",
      "Pimenta do reino moída na hora",
      "Sal para a água da massa"
    ],
    instructions: [
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
    createdAt: "2025-02-10T10:00:00Z",
    updatedAt: "2025-02-10T10:00:00Z",
    publishedAt: "2025-02-10T10:00:00Z"
  },
  {
    id: "seed-8",
    slug: "bolo-de-fuba-cremoso",
    title: "Bolo de Fubá Cremoso",
    description: "Bolo de fubá com textura cremosa no centro, perfeito para o café da tarde.",
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format",
    categorySlug: "bolos",
    tags: ["caseiro", "fácil"],
    status: "published",
    prepTime: 10,
    cookTime: 45,
    totalTime: 55,
    servings: 8,
    rating: 4.6,
    reviewsCount: 20,
    accessTier: "free",
    ingredients: [
      "3 ovos",
      "2 xícaras de leite",
      "1 xícara de fubá",
      "1 xícara de açúcar",
      "3 colheres de farinha de trigo",
      "2 colheres de manteiga",
      "1 colher de fermento"
    ],
    instructions: [
      "Bata tudo no liquidificador por 3 minutos.",
      "Despeje em forma untada e enfarinhada.",
      "Asse a 180°C por 45 minutos.",
      "Deixe esfriar antes de desenformar."
    ],
    createdAt: "2025-02-12T10:00:00Z",
    updatedAt: "2025-02-12T10:00:00Z",
    publishedAt: "2025-02-12T10:00:00Z"
  },
];

/**
 * Initialize seed data in localStorage if empty
 */
export function initSeedData() {
  const existing = localStorage.getItem("rdb_recipes_v2");
  if (!existing || existing === "[]") {
    localStorage.setItem("rdb_recipes_v2", JSON.stringify(seedRecipes));
  }
}
