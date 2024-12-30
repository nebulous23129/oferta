-- Criar a tabela de configurações do checkout
create table if not exists public.checkout_settings (
    id uuid primary key default uuid_generate_v4(),
    -- URLs de redirecionamento
    pix_boleto_redirect_url text,
    card_rejected_redirect_url text,
    card_approved_redirect_url text,
    
    -- Webhooks
    webhook_email text,
    webhook_customer text,
    webhook_address text,
    webhook_payment text,
    
    -- Chaves de API
    apikey_secret text,
    apikey_user text,
    facebook_pixel text,
    
    -- Timestamps
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.checkout_settings enable row level security;

-- Criar políticas de acesso
do $$
begin
    -- Remover políticas existentes se houver
    drop policy if exists "Allow read access to everyone" on public.checkout_settings;
    drop policy if exists "Allow insert and update for everyone" on public.checkout_settings;
    
    -- Criar novas políticas
    create policy "Allow read access to everyone"
        on public.checkout_settings
        for select
        using (true);

    create policy "Allow insert and update for everyone"
        on public.checkout_settings
        for all
        using (true)
        with check (true);
end$$;

-- Criar ou substituir a função de atualização do timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Criar trigger se não existir
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'set_updated_at') then
        create trigger set_updated_at
            before update on public.checkout_settings
            for each row
            execute procedure public.handle_updated_at();
    end if;
end$$;

-- Adiciona uma coluna para o ID único do produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS checkout_id UUID DEFAULT gen_random_uuid();

-- Garante que o checkout_id seja único
ALTER TABLE products ADD CONSTRAINT unique_checkout_id UNIQUE (checkout_id);

-- Cria um índice para melhorar a performance das buscas por checkout_id
CREATE INDEX IF NOT EXISTS idx_products_checkout_id ON products(checkout_id);

-- Função para gerar novo checkout_id se necessário
CREATE OR REPLACE FUNCTION generate_checkout_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkout_id IS NULL THEN
    NEW.checkout_id = gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir que todo produto tenha um checkout_id
DROP TRIGGER IF EXISTS ensure_checkout_id ON products;
CREATE TRIGGER ensure_checkout_id
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_checkout_id();

-- Atualiza produtos existentes com checkout_id
UPDATE products SET checkout_id = gen_random_uuid() WHERE checkout_id IS NULL;
