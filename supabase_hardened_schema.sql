-- ################################################
-- RECEITASBELL 🦊 - THE 100% POTENTIAL SCHEMA
-- ################################################
-- Este arquivo contém o esquema de banco de dados perfeito
-- para uma aplicação multi-tenant, ultra-segura e escalável.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS DE INFRAESTRUTURA (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. PERFIS DE USUÁRIO (Vinculados ao Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id),
    full_name text,
    avatar_url text,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. CATEGORIAS DE RECEITAS
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    icon text,
    created_at timestamptz DEFAULT now()
);

-- 5. RECEITAS (O Coração do App)
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    category_id uuid REFERENCES public.categories(id),
    title text NOT NULL,
    description text,
    ingredients jsonb NOT NULL DEFAULT '[]',
    instructions text NOT NULL,
    image_url text,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. AUDITORIA (Segurança Máxima)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    target_table text NOT NULL,
    payload jsonb,
    created_at timestamptz DEFAULT now()
);

-- ################################################
-- SEGURANÇA - ROW LEVEL SECURITY (RLS)
-- ################################################

-- Habilitando RLS em tudo
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: ORGANIZATIONS
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- POLÍTICAS: PROFILES
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- POLÍTICAS: RECIPES (A mais importante)
CREATE POLICY "Users can view recipes from their tenant"
ON public.recipes FOR SELECT
USING (tenant_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
) OR is_public = true);

CREATE POLICY "Users can insert recipes into their tenant"
ON public.recipes FOR INSERT
WITH CHECK (tenant_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update their own recipes"
ON public.recipes FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- ################################################
-- FUNÇÕES AUTOMÁTICAS (Triggers)
-- ################################################

-- Função para atualizar o 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_recipes BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
