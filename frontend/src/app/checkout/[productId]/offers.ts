import { StaticImageData } from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export interface OfferProduct {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  imageUrl: string;
}

export interface Offer {
  id: string;
  type: 'orderbump' | 'upsell';
  product: OfferProduct;
  active: boolean;
}

export async function getOffers(productId: string): Promise<Offer[]> {
  const offers: Offer[] = [];
  const supabase = createClientComponentClient<Database>();

  // Buscar o produto principal para obter os IDs de orderbump e upsell
  const { data: mainProduct, error: mainError } = await supabase
    .from('products')
    .select('order_bump_product, order_bump_discount, upsell_product, upsell_discount')
    .eq('product_id', productId)
    .single();

  if (mainError || !mainProduct) return [];

  // Buscar produto do OrderBump se existir
  if (mainProduct.order_bump_product) {
    const { data: orderBumpProduct, error: orderBumpError } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', mainProduct.order_bump_product)
      .eq('status', 'active')
      .single();

    if (orderBumpProduct && !orderBumpError) {
      const discountedPrice = orderBumpProduct.price * (1 - (mainProduct.order_bump_discount || 0) / 100);
      offers.push({
        id: orderBumpProduct.product_id,
        type: 'orderbump',
        active: true,
        product: {
          id: orderBumpProduct.product_id,
          name: orderBumpProduct.name,
          description: orderBumpProduct.description || '',
          originalPrice: orderBumpProduct.price,
          discountedPrice,
          imageUrl: orderBumpProduct.image_url || ''
        }
      });
    }
  }

  // Buscar produto do Upsell se existir
  if (mainProduct.upsell_product) {
    const { data: upsellProduct, error: upsellError } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', mainProduct.upsell_product)
      .eq('status', 'active')
      .single();

    if (upsellProduct && !upsellError) {
      const discountedPrice = upsellProduct.price * (1 - (mainProduct.upsell_discount || 0) / 100);
      offers.push({
        id: upsellProduct.product_id,
        type: 'upsell',
        active: true,
        product: {
          id: upsellProduct.product_id,
          name: upsellProduct.name,
          description: upsellProduct.description || '',
          originalPrice: upsellProduct.price,
          discountedPrice,
          imageUrl: upsellProduct.image_url || ''
        }
      });
    }
  }

  return offers;
}
