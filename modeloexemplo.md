-- Create coupons table
create table public.coupons (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    discount decimal not null check (discount > 0 and discount <= 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    active boolean default true
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Create policies
create policy "Enable read access for authenticated users" on public.coupons
    for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on public.coupons
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users" on public.coupons
    for update using (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users" on public.coupons
    for delete using (auth.role() = 'authenticated');

-- Create function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_coupons_updated_at
    before update on public.coupons
    for each row
    execute function public.handle_updated_at();
