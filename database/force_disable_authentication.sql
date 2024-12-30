-- Script EXTREMO para desabilitar TODAS as restrições de segurança
-- USE APENAS EM DESENVOLVIMENTO ABSOLUTO

-- Desabilitar RLS completamente
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('public', 'storage')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Permitir tudo" ON %I.%I', r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Criar políticas EXTREMAMENTE permissivas
CREATE POLICY "Permitir tudo em produtos" 
ON products 
FOR ALL 
USING (true);

CREATE POLICY "Permitir tudo em storage" 
ON storage.objects 
FOR ALL 
USING (true);

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

-- Configurações finais
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verificação final
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN 'RLS Enabled (but open)'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname IN ('public', 'storage') 
  AND tablename IN ('products', 'objects');

-- AVISO CRÍTICO:
-- ESTE SCRIPT REMOVE ABSOLUTAMENTE TODAS AS RESTRIÇÕES
-- JAMAIS USE EM QUALQUER AMBIENTE QUE NÃO SEJA 
-- DESENVOLVIMENTO LOCAL IMEDIATO
