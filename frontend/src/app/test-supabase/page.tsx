'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'

// Interface para tipar os produtos
interface Product {
  id: number;
  product_id: string;
  name: string;
}

export default function SupabaseTest() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('Iniciando busca de produtos de teste')
        const { data, error } = await supabase
          .from('products')
          .select('id, product_id, name')
          .limit(5)

        console.log('Resultado da busca de teste:', { data, error })

        if (error) {
          console.error('Erro na busca:', error)
          setError(error.message)
        } else {
          setProducts(data || [])
        }
      } catch (catchError) {
        console.error('Erro inesperado:', catchError)
        setError(String(catchError))
      }
    }

    fetchProducts()
  }, [])

  if (error) {
    return <div>Erro: {error}</div>
  }

  return (
    <div>
      <h1>Produtos de Teste</h1>
      {products.length === 0 ? (
        <p>Nenhum produto encontrado</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>  {/* Usando o ID único do banco de dados */}
              {product.name} - {product.product_id}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
