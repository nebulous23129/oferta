-- Desabilitar RLS temporariamente
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON products;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON products;
DROP POLICY IF EXISTS "Produtos são públicos" ON products;

DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Imagens são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar" ON storage.objects;

-- Políticas de segurança para a tabela de produtos
CREATE POLICY "Permitir todas as operações para usuários autenticados" 
ON products 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Políticas de segurança para storage
CREATE POLICY "Permitir upload para usuários autenticados" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'product-images'
);

CREATE POLICY "Permitir leitura pública de imagens" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'product-images'
);

CREATE POLICY "Permitir atualização para usuários autenticados" 
ON storage.objects 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'product-images'
);

CREATE POLICY "Permitir deleção para usuários autenticados" 
ON storage.objects 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'product-images'
);

-- Reabilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verificar configurações
SELECT 
    schemaname, 
    tablename, 
    rowsecurity, 
    CASE 
        WHEN rowsecurity = true THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname IN ('public', 'storage') AND tablename IN ('products', 'objects');

-- Adicionar coluna para imagem se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='products' AND column_name='image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Garantir que a coluna image_url aceite valores nulos
ALTER TABLE products ALTER COLUMN image_url DROP NOT NULL;
