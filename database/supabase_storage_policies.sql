-- Políticas de segurança para o bucket de imagens de produtos

-- Habilitar RLS para o bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para upload de imagens (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem fazer upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'product-images'
);

-- Política para leitura de imagens (público)
CREATE POLICY "Imagens são públicas" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'product-images'
);

-- Política para atualização de imagens (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem atualizar" 
ON storage.objects 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'product-images'
);

-- Política para deleção de imagens (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem deletar" 
ON storage.objects 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'product-images'
);
