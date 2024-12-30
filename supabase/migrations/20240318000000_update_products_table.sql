-- Adiciona uma coluna para o ID único do produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS checkout_id UUID DEFAULT gen_random_uuid();

-- Garante que o checkout_id seja único
ALTER TABLE products ADD CONSTRAINT unique_checkout_id UNIQUE (checkout_id);

-- Cria um índice para melhorar a performance das buscas por checkout_id
CREATE INDEX IF NOT EXISTS idx_products_checkout_id ON products(checkout_id);

-- Função para gerar novo checkout_id se necessário
CREATE OR REPLACE FUNCTION generate_checkout_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkout_id IS NULL THEN
    NEW.checkout_id = gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir que todo produto tenha um checkout_id
CREATE OR REPLACE TRIGGER ensure_checkout_id
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_checkout_id();
