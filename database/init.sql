-- Criar tipos ENUM
CREATE TYPE product_type AS ENUM ('physical', 'digital');
CREATE TYPE product_status AS ENUM ('active', 'inactive');
CREATE TYPE payment_affiliation AS ENUM ('pagarme', 'iugu');
CREATE TYPE payment_method AS ENUM ('pix', 'card', 'boleto');
CREATE TYPE order_status AS ENUM ('pending', 'approved', 'denied');

-- Tabela products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(9) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    promotional_price DECIMAL(10, 2),
    ncm_code VARCHAR(8),
    sku VARCHAR(50),
    ean_13 VARCHAR(13),
    seo_title VARCHAR(255),
    seo_link VARCHAR(255),
    seo_description TEXT,
    seo_content TEXT,
    category VARCHAR(50),
    warranty VARCHAR(50),
    image_url TEXT,
    redirect_pix_boleto VARCHAR(255),
    redirect_card_approved VARCHAR(255),
    redirect_card_denied VARCHAR(255),
    shipping_1 DECIMAL(10, 2),
    shipping_2 DECIMAL(10, 2),
    shipping_3 DECIMAL(10, 2),
    product_type product_type NOT NULL DEFAULT 'physical',
    status product_status NOT NULL DEFAULT 'active',
    order_bump VARCHAR(9),
    upsell VARCHAR(9),
    payment_affiliation payment_affiliation DEFAULT 'pagarme',
    payment_methods JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_bump) REFERENCES products(product_id),
    FOREIGN KEY (upsell) REFERENCES products(product_id)
);

-- Tabela customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address JSONB,
    card_number VARCHAR(16),
    card_name VARCHAR(255),
    installments SMALLINT,
    cvv VARCHAR(4),
    expiration_date VARCHAR(7),
    bin VARCHAR(6),
    card_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email),
    UNIQUE(cpf)
);

-- Tabela orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id UUID DEFAULT gen_random_uuid(),
    product_id VARCHAR(9) NOT NULL,
    customer_id UUID NOT NULL,
    shipping_option VARCHAR(50),
    total_price DECIMAL(10, 2) NOT NULL,
    order_bump_id VARCHAR(9),
    upsell_id VARCHAR(9),
    status order_status DEFAULT 'pending',
    pixel_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (order_bump_id) REFERENCES products(product_id),
    FOREIGN KEY (upsell_id) REFERENCES products(product_id)
);

-- Tabela webhooks
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    redirect_pix_boleto VARCHAR(255),
    redirect_card_approved VARCHAR(255),
    redirect_card_denied VARCHAR(255),
    webhook_email TEXT,
    webhook_customer TEXT,
    webhook_address TEXT,
    webhook_payment TEXT,
    apikey_secret TEXT,
    apikey_user TEXT,
    pixel_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela logs
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração padrão
INSERT INTO settings (
    redirect_pix_boleto,
    redirect_card_approved,
    redirect_card_denied,
    webhook_email,
    webhook_customer,
    webhook_address,
    webhook_payment
) VALUES (
    'https://checkout7pay.com/redirect/pix-boleto',
    'https://checkout7pay.com/redirect/card-approved',
    'https://checkout7pay.com/redirect/card-denied',
    'https://checkout7pay.com/webhook/email',
    'https://checkout7pay.com/webhook/customer',
    'https://checkout7pay.com/webhook/address',
    'https://checkout7pay.com/webhook/payment'
);
