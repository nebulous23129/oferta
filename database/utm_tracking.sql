-- Criação da tabela de rastreamento de UTMs
create table if not exists public.utm_tracking (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references orders(id),
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Permissões RLS (Row Level Security)
alter table public.utm_tracking enable row level security;

-- Políticas de acesso
create policy "Permitir inserção para usuários autenticados"
on public.utm_tracking for insert
to authenticated
with check (true);

create policy "Permitir leitura para usuários autenticados"
on public.utm_tracking for select
to authenticated
using (true);
