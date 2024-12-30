-- Create the checkout_settings table
create table public.checkout_settings (
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

-- Create RLS policies
alter table public.checkout_settings enable row level security;

-- Permitir leitura para todos (temporário, ajustar depois com autenticação)
create policy "Allow read access to everyone"
    on public.checkout_settings
    for select
    using (true);

-- Permitir inserção e atualização (temporário, ajustar depois com autenticação)
create policy "Allow insert and update for everyone"
    on public.checkout_settings
    for all
    using (true)
    with check (true);

-- Trigger para atualizar o updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.checkout_settings
    for each row
    execute procedure public.handle_updated_at();
