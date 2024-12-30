-- Desabilitar Row Level Security completamente

-- Para tabela de produtos
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DO $$
BEGIN
  -- Remover políticas existentes com nomes específicos
  PERFORM pg_catalog.pg_policies_drop_policy('products', 'Permitir todas as operações');
  PERFORM pg_catalog.pg_policies_drop_policy('products', 'Permitir todas as operações para usuários autenticados');
EXCEPTION WHEN OTHERS THEN
  -- Ignorar erros se a política não existir
  RAISE NOTICE 'Erro ao remover políticas existentes: %', SQLERRM;
END $$;

-- Criar política que permite todas as operações para qualquer um
CREATE POLICY "Permitir todas as operacoes" 
ON products 
FOR ALL 
USING (true);

-- Para objetos de storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes de storage
DO $$
BEGIN
  -- Remover políticas existentes com nomes específicos
  PERFORM pg_catalog.pg_policies_drop_policy('storage.objects', 'Permitir upload de qualquer um');
  PERFORM pg_catalog.pg_policies_drop_policy('storage.objects', 'Permitir leitura de qualquer um');
  PERFORM pg_catalog.pg_policies_drop_policy('storage.objects', 'Permitir atualização de qualquer um');
  PERFORM pg_catalog.pg_policies_drop_policy('storage.objects', 'Permitir deleção de qualquer um');
EXCEPTION WHEN OTHERS THEN
  -- Ignorar erros se a política não existir
  RAISE NOTICE 'Erro ao remover políticas existentes de storage: %', SQLERRM;
END $$;

-- Criar políticas que permitem todas as operações para qualquer um
CREATE POLICY "Permitir upload de qualquer um" 
ON storage.objects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir leitura de qualquer um" 
ON storage.objects 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir atualizacao de qualquer um" 
ON storage.objects 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir delecao de qualquer um" 
ON storage.objects 
FOR DELETE 
USING (true);

-- Reabilitar RLS (mas com políticas completamente abertas)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verificar configurações finais
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

-- Garantir que a coluna image_url existe e aceita valores nulos
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

ALTER TABLE products ALTER COLUMN image_url DROP NOT NULL;

-- AVISO IMPORTANTE: 
-- ESTE SCRIPT REMOVE TODAS AS RESTRIÇÕES DE SEGURANÇA
-- USE APENAS EM AMBIENTE DE DESENVOLVIMENTO
-- NÃO RECOMENDADO PARA PRODUÇÃO
