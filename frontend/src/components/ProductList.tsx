"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ProductForm from './ProductForm';
import { LinkIcon } from '@heroicons/react/24/outline';

interface Product {
  product_id: string;
  name: string;
  display_name: string;
  price: number;
  promotional_price: number | null;
  status: 'active' | 'inactive' | 'draft';
  page_link: string;
  checkout_id: string;
  created_at: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .match({ product_id: productId });

      if (error) throw error;
      setProducts(products.filter(p => p.product_id !== productId));
      alert('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleCopyLink = (product: Product) => {
    const checkoutLink = `${window.location.origin}/checkout/${product.checkout_id}`;
    navigator.clipboard.writeText(checkoutLink)
      .then(() => alert('Link copiado para a área de transferência!'))
      .catch(() => alert('Erro ao copiar link'));
  };

  const handleCopyCheckoutLink = (checkoutId: string) => {
    const url = `${window.location.origin}/checkout/${checkoutId}`;
    navigator.clipboard.writeText(url)
      .then(() => alert('Link do checkout copiado!'))
      .catch(() => alert('Erro ao copiar link'));
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'draft':
        return 'Rascunho';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#65D19C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Editar Produto</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProductForm
              onSuccess={() => {
                fetchProducts();
                setIsEditModalOpen(false);
                setEditingProduct(null);
              }}
              initialValues={editingProduct}
            />
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nome de Exibição
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Preço Promocional
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Link do Checkout
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <AnimatePresence>
                    {products.map((product) => (
                      <motion.tr
                        key={product.product_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {product.display_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.promotional_price ? (
                            <span className="text-green-600 font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(product.promotional_price)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sem desconto</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeStyle(product.status)}`}>
                            {getStatusText(product.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <button
                            onClick={() => handleCopyCheckoutLink(product.checkout_id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Copiar Link
                          </button>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-[#65D19C] hover:text-[#58b589]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(product.product_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                            <button
                              onClick={() => handleCopyLink(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Copiar Link
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
