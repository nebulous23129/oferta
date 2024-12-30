'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ProductSummaryProps {
  product: {
    name: string;
    description: string;
    price: number;
    promotional_price: number;
    image_url: string;
  };
  quantity: number;
  shippingCost?: number;
  onQuantityChange: (quantity: number) => void;
}

export default function ProductSummary({
  product,
  quantity,
  shippingCost = 0,
  onQuantityChange
}: ProductSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const finalPrice = product.promotional_price || product.price;
  const subtotal = finalPrice * quantity;
  const total = subtotal + (shippingCost || 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className={`rounded-lg transition-all duration-300 ${
      isExpanded ? 'bg-white shadow-lg' : 'bg-green-500'
    }`}>
      {/* Header - sempre visível */}
      <div
        className={`p-4 flex justify-between items-center cursor-pointer ${
          isExpanded ? 'border-b border-gray-200' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${isExpanded ? 'text-gray-800' : 'text-white'}`}>
            Resumo do Pedido
          </span>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-white" />
          )}
        </div>
        <span className={`font-bold ${isExpanded ? 'text-gray-800' : 'text-white'}`}>
          {formatPrice(total)}
        </span>
      </div>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="flex space-x-4">
            <div className="relative w-20 h-20">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => quantity > 1 && onQuantityChange(quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Preço unitário</div>
              <div className="font-medium text-gray-800">
                {formatPrice(finalPrice)}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {shippingCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
