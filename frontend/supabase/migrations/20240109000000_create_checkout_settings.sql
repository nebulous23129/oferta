-- Create the checkout_settings table
CREATE TABLE IF NOT EXISTS checkout_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_url TEXT NOT NULL,
    webhook_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on webhook_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_checkout_settings_webhook_type ON checkout_settings(webhook_type);

-- Insert default webhook URLs for development
INSERT INTO checkout_settings (webhook_url, webhook_type) VALUES
    ('http://localhost:3000/api/webhooks/email', 'email'),
    ('http://localhost:3000/api/webhooks/customer', 'customer'),
    ('http://localhost:3000/api/webhooks/address', 'address'),
    ('http://localhost:3000/api/webhooks/payment', 'payment');

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before update
CREATE TRIGGER update_checkout_settings_updated_at
    BEFORE UPDATE ON checkout_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
