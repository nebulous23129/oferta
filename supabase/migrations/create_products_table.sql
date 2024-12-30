-- Dropar a tabela existente
DROP TABLE IF EXISTS products CASCADE;

-- Criar a tabela products com todos os campos necessários
CREATE TABLE products (
    -- Identificação do produto
    product_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    display_name VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    promotional_price DECIMAL(10,2),
    product_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL,

    -- Campos SEO
    page_title VARCHAR,
    page_link VARCHAR,
    page_description TEXT,
    page_content TEXT,

    -- URLs de Redirecionamento
    pix_boleto_redirect_url VARCHAR,
    card_rejected_redirect_url VARCHAR,
    card_approved_redirect_url VARCHAR,

    -- Produtos Relacionados
    order_bump_product VARCHAR,
    upsell_product VARCHAR,

    -- Descontos de Pagamento
    pix_discount DECIMAL(5,2) DEFAULT 0,
    card_discount DECIMAL(5,2) DEFAULT 0,
    boleto_discount DECIMAL(5,2) DEFAULT 0,

    -- Campos de Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Restrições
    CONSTRAINT valid_product_type CHECK (product_type IN ('physical', 'digital')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'draft')),
    CONSTRAINT valid_pix_discount CHECK (pix_discount >= 0 AND pix_discount <= 100),
    CONSTRAINT valid_card_discount CHECK (card_discount >= 0 AND card_discount <= 100),
    CONSTRAINT valid_boleto_discount CHECK (boleto_discount >= 0 AND boleto_discount <= 100)
);

-- Criar índices para melhor performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_product_type ON products(product_type);

-- Criar função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar políticas RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (temporariamente para desenvolvimento)
CREATE POLICY "Permitir todas as operações"
    ON products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE products IS 'Tabela de produtos do sistema Checkout7Pay';
COMMENT ON COLUMN products.product_id IS 'ID único do produto';
COMMENT ON COLUMN products.name IS 'Nome interno do produto';
COMMENT ON COLUMN products.display_name IS 'Nome de exibição do produto';
COMMENT ON COLUMN products.description IS 'Descrição detalhada do produto';
COMMENT ON COLUMN products.price IS 'Preço regular do produto';
COMMENT ON COLUMN products.promotional_price IS 'Preço promocional do produto';
COMMENT ON COLUMN products.product_type IS 'Tipo do produto (físico ou digital)';
COMMENT ON COLUMN products.status IS 'Status do produto (ativo, inativo ou rascunho)';
COMMENT ON COLUMN products.page_title IS 'Título da página do produto para SEO';
COMMENT ON COLUMN products.page_link IS 'Link amigável da página do produto';
COMMENT ON COLUMN products.page_description IS 'Descrição da página do produto para SEO';
COMMENT ON COLUMN products.page_content IS 'Conteúdo completo da página do produto';
COMMENT ON COLUMN products.pix_boleto_redirect_url IS 'URL de redirecionamento após pagamento via Pix/Boleto';
COMMENT ON COLUMN products.card_rejected_redirect_url IS 'URL de redirecionamento após rejeição do cartão';
COMMENT ON COLUMN products.card_approved_redirect_url IS 'URL de redirecionamento após aprovação do cartão';
COMMENT ON COLUMN products.order_bump_product IS 'ID do produto para order bump';
COMMENT ON COLUMN products.upsell_product IS 'ID do produto para upsell';
COMMENT ON COLUMN products.pix_discount IS 'Percentual de desconto para pagamento via Pix';
COMMENT ON COLUMN products.card_discount IS 'Percentual de desconto para pagamento via Cartão';
COMMENT ON COLUMN products.boleto_discount IS 'Percentual de desconto para pagamento via Boleto';
