'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Product } from '@/services/supabase';
import { Offer } from '@/app/checkout/[productId]/offers';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface OrderSummaryProps {
  product: Product;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedOffers: { [key: string]: boolean };
  offers: Offer[];
  paymentMethod: string;
  onTotalChange: (total: number) => void;
  onDiscountedTotalChange: (total: number) => void;
  shippingCost?: number;
}

// Função para formatar valores monetários com arredondamento
export const formatCurrency = (value: number) => {
  // Arredonda para 2 casas decimais
  const rounded = Math.ceil(value * 100) / 100;
  return rounded.toFixed(2).replace('.', ',');
};

export default function OrderSummary({
  product,
  quantity,
  setQuantity,
  selectedOffers,
  offers,
  paymentMethod,
  onTotalChange,
  onDiscountedTotalChange,
  shippingCost = 0
}: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isValidCoupon, setIsValidCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Usa o preço promocional se disponível, senão usa o preço normal
  const currentPrice = product.promotional_price || product.price;

  // Calcula o subtotal dos produtos selecionados (OrderBump e Upsell)
  const offersSubtotal = useMemo(() => {
    return offers.reduce((acc, offer) => {
      if (selectedOffers[offer.id]) {
        return acc + offer.product.discountedPrice;
      }
      return acc;
    }, 0);
  }, [offers, selectedOffers]);

  // Calcula o desconto do cupom
  const couponDiscountAmount = useMemo(() => {
    const subtotal = currentPrice * quantity;
    return appliedCoupon ? (subtotal * couponDiscount) / 100 : 0;
  }, [currentPrice, quantity, appliedCoupon, couponDiscount]);

  // Calcula o total base (antes do desconto do método de pagamento)
  const calculateTotalWithoutPaymentDiscount = useCallback(() => {
    const subtotal = currentPrice * quantity;
    const totalWithOffers = subtotal + offersSubtotal;
    return totalWithOffers - couponDiscountAmount + shippingCost;
  }, [currentPrice, quantity, offersSubtotal, couponDiscountAmount, shippingCost]);

  // Calcula o desconto do método de pagamento
  const paymentDiscount = useMemo(() => {
    const totalBeforePaymentDiscount = calculateTotalWithoutPaymentDiscount() - shippingCost; // Não aplica desconto no frete
    
    // Seleciona o desconto baseado no método de pagamento
    let discount = 0;
    switch (paymentMethod) {
      case 'pix':
        discount = product.pix_discount || 0;
        break;
      case 'credit':
      case 'card':
        discount = product.card_discount || 0;
        break;
      case 'boleto':
        discount = product.boleto_discount || 0;
        break;
      default:
        discount = 0;
    }
    
    const discountAmount = totalBeforePaymentDiscount * (discount / 100);
    
    return discountAmount;
  }, [calculateTotalWithoutPaymentDiscount, paymentMethod, shippingCost, product]);

  // Atualiza o total quando houver mudanças
  useEffect(() => {
    const total = calculateTotalWithoutPaymentDiscount() - paymentDiscount;
    onTotalChange(total);
    onDiscountedTotalChange(total);
  }, [calculateTotalWithoutPaymentDiscount, paymentDiscount, onTotalChange, onDiscountedTotalChange]);

  // Renderiza a tag de economia
  const renderSavingsTag = () => {
    if (paymentDiscount <= 0) return null;
    return (
      <div className="bg-[#22C55E] text-white text-[10px] px-2 py-0.5 rounded-sm flex items-center gap-1">
        <span>Finalize a compra hoje e garanta uma economia de R$ {formatCurrency(paymentDiscount)}</span>
      </div>
    );
  };

  const handleIncrement = () => {
    setQuantity(quantity + 1)
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  // Função para aplicar o cupom
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      // Busca o cupom no banco de dados
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim())
        .eq('is_active', true)
        .single();

      if (error) {
        setCouponError('Cupom inválido. Confira o código e tente novamente.');
        return;
      }

      if (!coupon) {
        setCouponError('Cupom inválido');
        return;
      }

      setAppliedCoupon(couponCode);
      setCouponCode('');
      setIsValidCoupon(true);
      setCouponDiscount(coupon.discount);
      setCouponError(null);
    } catch (error) {
      setCouponError('Erro ao aplicar cupom. Tente novamente.');
    }
  }

  // Função para remover o cupom aplicado
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setIsValidCoupon(false);
    setCouponDiscount(0);
    setCouponError(null);
  }

  return (
    <div className={`rounded-lg ${isExpanded ? 'bg-white' : 'bg-[#E3E8ED]'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex justify-between items-center"
      >
        <div className="text-left">
          <h3 className="text-xs font-medium">RESUMO ({quantity})</h3>
          <p className="text-xs text-gray-600">Informações da sua compra</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isExpanded ? 'text-xs text-black' : 'text-[15px] text-[#22C55E]'}`}>
            R$ {formatCurrency(calculateTotalWithoutPaymentDiscount() - paymentDiscount)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-[60px] h-[60px] flex-shrink-0">
              <Image
                src={product.image_url || '/imgprincipal.png'}
                alt={product.display_name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{product.display_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleDecrement}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xs">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-700 ml-2">
                  R$ {currentPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Produtos adicionais selecionados */}
          {offers.map(offer => {
            if (selectedOffers[offer.id]) {
              return (
                <div key={offer.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{offer.product.name}</span>
                  <span className="font-medium text-green-600">
                    R$ {offer.product.discountedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            }
            return null;
          })}

          <div className="border-t pt-3">
            {!appliedCoupon ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Código do cupom"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1DA6E0] focus:border-[#1DA6E0]"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="text-[#1DA6E0] text-xs ml-2 disabled:opacity-50"
                    disabled={!couponCode.trim()}
                  >
                    Adicionar
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs">{couponError}</p>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium">Cupom aplicado: {appliedCoupon}</p>
                  <p className="text-xs text-gray-600">Desconto de {couponDiscount}%</p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-red-500 text-xs hover:text-red-600"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {(currentPrice * quantity).toFixed(2).replace('.', ',')}</span>
            </div>

            {offersSubtotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Produtos adicionais</span>
                <span>+ R$ {offersSubtotal.toFixed(2).replace('.', ',')}</span>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto do cupom</span>
                <span className="text-green-600">- R$ {couponDiscountAmount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}

            {shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frete</span>
                <span>+ R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
              </div>
            )}

            {paymentDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Oferta de hoje</span>
                <span className="text-green-600">- R$ {formatCurrency(paymentDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-medium pt-2 border-t">
              <span>Total</span>
              <span className="text-[#22C55E]">
                R$ {formatCurrency(calculateTotalWithoutPaymentDiscount() - paymentDiscount)}
              </span>
            </div>
          </div>
        </div>
      )}
      {renderSavingsTag()}
    </div>
  );
}
