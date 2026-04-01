-- ################################################
-- RECEITASBELL 🦊 - Supabase Migration Script
-- Generated from actual codebase usage
-- ################################################
-- Run this in your Supabase SQL Editor to create
-- all tables the application expects.
-- ################################################

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZATIONS (multi-tenant root)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    host text DEFAULT '',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. USERS (identity layer)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    password_hash text,
    role text DEFAULT 'user',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    slug text NOT NULL,
    name text NOT NULL,
    description text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- 5. RECIPES
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    author_id uuid,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    category_id uuid REFERENCES public.categories(id),
    tags_json text[],
    status text DEFAULT 'draft',
    prep_time_min int DEFAULT 0,
    cook_time_min int DEFAULT 0,
    total_time_min int DEFAULT 0,
    servings int DEFAULT 1,
    kcal int,
    video_id text,
    access_tier text DEFAULT 'free',
    price_brl numeric(10,2),
    ingredients_json jsonb DEFAULT '[]'::jsonb,
    instructions_text text,
    excerpt text,
    seo_title text,
    seo_description text,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    published_at timestamptz
);

-- 6. SETTINGS (key-value per tenant)
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    key text NOT NULL,
    value text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, key)
);

-- 7. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.organizations(id),
    actor_type text NOT NULL DEFAULT 'user',
    actor_id text NOT NULL DEFAULT '0',
    action text NOT NULL,
    resource_type text,
    resource_id text,
    payload jsonb,
    created_at timestamptz DEFAULT now()
);

-- 8. SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text NOT NULL,
    tenant_id text,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 9. MAGIC LINKS
CREATE TABLE IF NOT EXISTS public.magic_links (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    tenant_id text,
    token text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 10. OAUTH STATES
CREATE TABLE IF NOT EXISTS public.oauth_states (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider text NOT NULL,
    state text NOT NULL,
    redirect_to text,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 11. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    recipe_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, user_id, recipe_id)
);

-- 12. SHOPPING LIST
CREATE TABLE IF NOT EXISTS public.shopping_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    recipe_id text,
    items_json jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 13. NEWSLETTER
CREATE TABLE IF NOT EXISTS public.newsletter (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 14. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_id text NOT NULL,
    user_id text,
    user_name text,
    body text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 15. RATINGS
CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_id text NOT NULL,
    user_id text,
    score int NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 16. PAYMENT ORDERS
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id text,
    status text DEFAULT 'pending',
    provider text DEFAULT 'stripe',
    amount int DEFAULT 0,
    currency text DEFAULT 'BRL',
    external_reference text,
    idempotency_key text,
    payer_email text,
    payment_method text,
    provider_payment_id text,
    items_json jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 17. PAYMENT EVENTS
CREATE TABLE IF NOT EXISTS public.payment_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payment_order_id uuid REFERENCES public.payment_orders(id),
    event_type text NOT NULL,
    payload jsonb,
    created_at timestamptz DEFAULT now()
);

-- 18. PAYMENT NOTES
CREATE TABLE IF NOT EXISTS public.payment_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payment_order_id uuid REFERENCES public.payment_orders(id),
    body text NOT NULL,
    author_id text,
    created_at timestamptz DEFAULT now()
);

-- 19. STRIPE CONNECT ACCOUNTS
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_account_id text NOT NULL,
    status text DEFAULT 'pending',
    details_submitted boolean DEFAULT false,
    charges_enabled boolean DEFAULT false,
    payouts_enabled boolean DEFAULT false,
    default_currency text DEFAULT 'BRL',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 20. STRIP CONNECTIONS (legacy OAuth)
CREATE TABLE IF NOT EXISTS public.stripe_connections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id text NOT NULL,
    stripe_account_id text NOT NULL,
    access_token_encrypted text NOT NULL,
    scope text DEFAULT '',
    status text DEFAULT 'disconnected',
    connected_at timestamptz,
    disconnected_at timestamptz,
    last_error text,
    created_by_user_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 21. STRIPE OAUTH STATES
CREATE TABLE IF NOT EXISTS public.stripe_oauth_states (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id text NOT NULL,
    tenant_user_id text DEFAULT 'system',
    state_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    return_to text DEFAULT '/admin/pagamentos/configuracoes',
    created_at timestamptz DEFAULT now()
);

-- 22. ENTITLEMENTS (recipe purchases)
CREATE TABLE IF NOT EXISTS public.entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    recipe_id text NOT NULL,
    payment_order_id uuid REFERENCES public.payment_orders(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, user_id, recipe_id)
);

-- 23. USER IDENTITIES (social auth)
CREATE TABLE IF NOT EXISTS public.user_identities (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    provider_id text NOT NULL,
    email text,
    created_at timestamptz DEFAULT now()
);

-- ################################################
-- INDEXES for common query patterns
-- ################################################
CREATE INDEX IF NOT EXISTS idx_recipes_tenant_status ON public.recipes(tenant_id, status, is_active);
CREATE INDEX IF NOT EXISTS idx_recipes_tenant_slug ON public.recipes(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON public.categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_settings_tenant_key ON public.settings(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON public.magic_links(email, expires_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_user ON public.shopping_list(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant ON public.payment_orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_order ON public.payment_events(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_tenant ON public.stripe_connect_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_recipe ON public.entitlements(tenant_id, user_id, recipe_id);

-- ################################################
-- SEED DATA: default tenant
-- ################################################
INSERT INTO public.organizations (slug, name, host, is_active)
VALUES ('receitasbell', 'Receitas do Bell', 'receitasbell.local', true)
ON CONFLICT (slug) DO NOTHING;

-- ################################################
-- DISABLE RLS FOR NOW (service_role bypasses it)
-- If you want RLS, enable per-table and add policies
-- ################################################
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
-- etc.
