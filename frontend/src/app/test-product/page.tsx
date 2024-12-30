'use client'

import { useState, useEffect } from 'react'
import { getProduct, Product } from '@/services/supabase'

export default function ProductTest() {
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productId, setProductId] = useState<string>('')

  const handleFetchProduct = async () => {
    if (!productId) {
      setError('Por favor, insira um ID de produto')
      return
    }

    try {
      const fetchedProduct = await getProduct(productId)
      
      if (fetchedProduct) {
        setProduct(fetchedProduct)
        setError(null)
      } else {
        setProduct(null)
        setError('Produto não encontrado')
      }
    } catch (err) {
      console.error('Erro ao buscar produto:', err)
      setError(String(err))
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Busca de Produto</h1>
      
      <div className="flex mb-4">
        <input 
          type="text" 
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Digite o ID do produto"
          className="border p-2 mr-2 flex-grow"
        />
        <button 
          onClick={handleFetchProduct}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Buscar Produto
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {product && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">Detalhes do Produto</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Nome:</strong> {product.name}</div>
            <div><strong>ID do Produto:</strong> {product.product_id}</div>
            <div><strong>Preço:</strong> R$ {product.price.toFixed(2)}</div>
            <div><strong>Status:</strong> {product.status}</div>
          </div>
        </div>
      )}
    </div>
  )
}
