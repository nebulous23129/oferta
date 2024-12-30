-- Adicionar colunas de desconto para OrderBump e Upsell
ALTER TABLE products
ADD COLUMN order_bump_discount DECIMAL(5,2) DEFAULT 0,
ADD COLUMN upsell_discount DECIMAL(5,2) DEFAULT 0;

-- Adicionar restrições de validação
ALTER TABLE products
ADD CONSTRAINT valid_order_bump_discount CHECK (order_bump_discount >= 0 AND order_bump_discount <= 100),
ADD CONSTRAINT valid_upsell_discount CHECK (upsell_discount >= 0 AND upsell_discount <= 100);

-- Adicionar comentários para documentação
COMMENT ON COLUMN products.order_bump_discount IS 'Percentual de desconto para o produto OrderBump';
COMMENT ON COLUMN products.upsell_discount IS 'Percentual de desconto para o produto Upsell';
