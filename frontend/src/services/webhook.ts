import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface WebhookUrls {
  webhook_email: string;
  webhook_customer: string;
  webhook_address: string;
  webhook_payment: string;
}

// Cache para controle de rate limit dos webhooks
const webhookRateLimit = new Map<string, { count: number; timestamp: number }>();

// Função para verificar rate limit dos webhooks
function checkWebhookRateLimit(webhookType: string): void {
  const now = Date.now();
  const limit = webhookRateLimit.get(webhookType);

  if (limit) {
    // Reseta o contador após 1 minuto
    if (now - limit.timestamp > 60000) {
      webhookRateLimit.set(webhookType, { count: 1, timestamp: now });
      return;
    }

    if (limit.count >= 60) { // Máximo de 60 chamadas por minuto por tipo de webhook
      throw new Error('Limite de chamadas de webhook excedido. Tente novamente em alguns minutos.');
    }

    webhookRateLimit.set(webhookType, { count: limit.count + 1, timestamp: limit.timestamp });
  } else {
    webhookRateLimit.set(webhookType, { count: 1, timestamp: now });
  }
}

// Função auxiliar para enviar webhook com cabeçalhos de autorização
async function sendWebhook(url: string, payload: any, webhookType: string) {
  if (!url) {
    throw new Error('URL do webhook não configurada');
  }

  try {
    // Verifica rate limit antes de enviar
    checkWebhookRateLimit(webhookType);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_KEY || ''}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha no envio: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    throw error;
  }
}

// Função para buscar URLs dos webhooks
export async function fetchWebhookUrls(): Promise<WebhookUrls> {
  try {
    const { data, error } = await supabase
      .from('checkout_settings')
      .select('webhook_email, webhook_customer, webhook_address, webhook_payment')
      .limit(1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        webhook_email: '',
        webhook_customer: '',
        webhook_address: '',
        webhook_payment: ''
      };
    }

    const webhookUrls = data[0];
    return webhookUrls;
  } catch (error) {
    throw error;
  }
}

// Enviar webhook de email
export async function sendEmailWebhook(email: string, product: any, webhookUrls?: WebhookUrls) {
  try {
    if (!webhookUrls) {
      webhookUrls = await fetchWebhookUrls();
    }

    const payload = {
      email,
      product_info: product,
      timestamp: new Date().toISOString()
    };

    const response = await sendWebhook(webhookUrls.webhook_email, payload, 'email');
    return response;
  } catch (error) {
    throw error;
  }
}

// Enviar webhook de cliente
export async function sendCustomerWebhook(data: {
  name: string;
  document: string;
  phone: string;
  product: any;
}, webhookUrls?: WebhookUrls) {
  try {
    if (!webhookUrls) {
      webhookUrls = await fetchWebhookUrls();
    }

    const payload = {
      ...data,
      product_info: data.product,
      timestamp: new Date().toISOString()
    };

    const response = await sendWebhook(webhookUrls.webhook_customer, payload, 'customer');

    return response;
  } catch (error) {
    throw error;
  }
}

// Enviar webhook de endereço
export async function sendAddressWebhook(data: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  product: any;
  shipping_option?: string;
}, webhookUrls?: WebhookUrls) {
  try {
    if (!webhookUrls) {
      webhookUrls = await fetchWebhookUrls();
    }

    const payload = {
      ...data,
      product_info: data.product,
      timestamp: new Date().toISOString()
    };

    const response = await sendWebhook(webhookUrls.webhook_address, payload, 'address');

    return response;
  } catch (error) {
    throw error;
  }
}

// Função auxiliar para calcular o preço total
function calculateTotalPrice(product: any, data: any): number {
  let totalPrice = product.price;

  // Aplicar desconto do order bump se selecionado
  if (data.order_bump && product.order_bump_discount) {
    totalPrice *= (1 - product.order_bump_discount / 100);
  }

  // Aplicar desconto do upsell se selecionado
  if (data.upsell && product.upsell_discount) {
    totalPrice *= (1 - product.upsell_discount / 100);
  }

  return totalPrice;
}

// Enviar webhook de pagamento
export async function sendPaymentWebhook(data: {
  method: string;
  installments?: number;
  product: any;
  order_bump?: boolean;
  upsell?: boolean;
}, webhookUrls?: WebhookUrls) {
  try {
    if (!webhookUrls) {
      webhookUrls = await fetchWebhookUrls();
    }

    if (!data.product || typeof data.product.price !== 'number') {
      throw new Error('Dados do produto inválidos para cálculo do preço total');
    }

    const payload = {
      ...data,
      product_info: data.product,
      total_price: calculateTotalPrice(data.product, data),
      timestamp: new Date().toISOString()
    };

    const response = await sendWebhook(webhookUrls.webhook_payment, payload, 'payment');

    return response;

  } catch (error) {
    throw error;
  }
}

// Função para enviar webhook para o n8n
export const sendN8NWebhook = async (data: any) => {
  try {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
    
    if (!n8nUrl) {
      console.warn('URL do n8n não configurada');
      return;
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar webhook para n8n: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar webhook para n8n:', error);
    throw error;
  }
};
