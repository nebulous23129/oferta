'use client'

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/security.svg"
              alt="Segurança"
              width={20}
              height={20}
            />
            <span className="text-sm text-gray-600">
              Site seguro
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Image
              src="/payment-methods.png"
              alt="Métodos de Pagamento"
              width={280}
              height={30}
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Este site não é afiliado ao Facebook ou a qualquer entidade do Facebook. Depois que você sair do Facebook, a responsabilidade não é deles e sim do nosso site.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
