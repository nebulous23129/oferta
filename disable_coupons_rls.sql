-- Drop existing RLS policies for coupons table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.coupons;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.coupons;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.coupons;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.coupons;

-- Disable RLS on coupons table
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users and anon
GRANT ALL PRIVILEGES ON TABLE public.coupons TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.coupons TO anon;
