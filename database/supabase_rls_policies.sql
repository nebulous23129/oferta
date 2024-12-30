-- Políticas de segurança para a tabela de produtos

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para inserção de produtos
CREATE POLICY "Usuários autenticados podem inserir produtos" 
ON products 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização de produtos
CREATE POLICY "Usuários autenticados podem atualizar produtos" 
ON products 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Política para seleção de produtos (público)
CREATE POLICY "Produtos são públicos" 
ON products 
FOR SELECT 
USING (true);

-- Política para atualização do campo image_url
CREATE POLICY "Usuários autenticados podem atualizar imagem" 
ON products 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (image_url IS NULL OR image_url = '')
);
