import { createClient } from "@supabase/supabase-js";

// Em Vite, variáveis de ambiente para o cliente devem começar com VITE_
// Caso não estejam presentes, tentamos as versões sem o prefixo (para compatibilidade se estiverem definidas via define)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Variáveis de ambiente do Supabase não encontradas no lado do cliente. Certifique-se de usar o prefixo VITE_ no seu arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
