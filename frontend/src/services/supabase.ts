import { getSupabaseClient } from '@/lib/supabase-client';

export const supabase = getSupabaseClient();

export interface Product {
  [x: string]: any;
  id: number;
  product_id: string;
  checkout_id: string;
  name: string;
  display_name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  image_url: string;
  shipping_1: number;
  shipping_2: number;
  shipping_3: number;
  product_type: 'physical' | 'digital';
  status: 'active' | 'inactive';
  order_bump: string | null;
  upsell: string | null;
  payment_methods: {
    pix?: { enabled: boolean; discount: number };
    credit?: { enabled: boolean; discount: number };
    boleto?: { enabled: boolean; discount: number };
  };
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  product_id: string;
  type: 'order_bump' | 'upsell';
  status: 'active' | 'inactive';
}

export async function getAllProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  try {
    // Primeiro, tenta buscar por product_id
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'active')
      .maybeSingle();

    if (data) {
      return data;
    }

    // Se não encontrar por product_id, tenta por checkout_id
    const { data: checkoutData, error: checkoutError } = await supabase
      .from('products')
      .select('*')
      .eq('checkout_id', productId)
      .eq('status', 'active')
      .maybeSingle();

    if (checkoutData) {
      return checkoutData;
    }

    // Se nenhum produto for encontrado, retorna null
    return null;
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return null;
  }
}
