import React from 'react';

export default function OrderStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Status do Pedido */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-3 text-lg font-medium text-gray-900">
              Pedido Aprovado
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Seu pagamento foi processado com sucesso!
            </p>
          </div>

          {/* Resumo do Pedido */}
          <div className="mt-6">
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Resumo do Pedido
              </h3>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Produto</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    Nome do Produto
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Preço</dt>
                  <dd className="text-sm font-medium text-gray-900">R$ 0,00</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Quantidade</dt>
                  <dd className="text-sm font-medium text-gray-900">1</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Frete</dt>
                  <dd className="text-sm font-medium text-gray-900">R$ 0,00</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">R$ 0,00</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Status do Pagamento */}
          <div className="mt-6">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Pagamento Confirmado
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Seu pagamento foi processado e confirmado. Você receberá um
                      e-mail com os detalhes do pedido.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
