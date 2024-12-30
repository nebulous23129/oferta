-- Adiciona as colunas se elas não existirem
DO $$ 
BEGIN 
    -- Adiciona a coluna order_bump_product se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'order_bump_product') THEN
        ALTER TABLE products ADD COLUMN order_bump_product VARCHAR;
    END IF;

    -- Adiciona a coluna order_bump_discount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'order_bump_discount') THEN
        ALTER TABLE products ADD COLUMN order_bump_discount DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Adiciona a coluna upsell_product se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'upsell_product') THEN
        ALTER TABLE products ADD COLUMN upsell_product VARCHAR;
    END IF;

    -- Adiciona a coluna upsell_discount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'upsell_discount') THEN
        ALTER TABLE products ADD COLUMN upsell_discount DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Adiciona as constraints se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                  WHERE table_name = 'products' AND constraint_name = 'valid_order_bump_discount') THEN
        ALTER TABLE products 
        ADD CONSTRAINT valid_order_bump_discount 
        CHECK (order_bump_discount >= 0 AND order_bump_discount <= 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                  WHERE table_name = 'products' AND constraint_name = 'valid_upsell_discount') THEN
        ALTER TABLE products 
        ADD CONSTRAINT valid_upsell_discount 
        CHECK (upsell_discount >= 0 AND upsell_discount <= 100);
    END IF;
END $$;
