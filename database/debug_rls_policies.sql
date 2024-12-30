-- Verificar políticas de segurança para a tabela de produtos
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Verificar políticas de segurança para objetos de storage
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Verificar configurações de RLS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity, 
    CASE 
        WHEN rowsecurity = true THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('products', 'objects');

-- Políticas de segurança para a tabela de produtos (reset)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON products;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON products;
DROP POLICY IF EXISTS "Produtos são públicos" ON products;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar imagem" ON products;

-- Novas políticas de segurança para produtos
CREATE POLICY "Usuários autenticados podem inserir produtos" 
ON products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos" 
ON products 
FOR UPDATE 
USING (true);

CREATE POLICY "Produtos são públicos" 
ON products 
FOR SELECT 
USING (true);

-- Políticas de segurança para storage (reset)
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Imagens são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar" ON storage.objects;

-- Novas políticas de segurança para storage
CREATE POLICY "Usuários autenticados podem fazer upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Imagens são públicas" 
ON storage.objects 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem atualizar" 
ON storage.objects 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários autenticados podem deletar" 
ON storage.objects 
FOR DELETE 
USING (true);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
