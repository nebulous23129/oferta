import React from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[60px]">
      {/* Barra superior verde */}
      <div className="h-0.5 bg-gradient-to-r from-[#65D19C] to-[#58b588]"></div>
      
      {/* Header principal */}
      <header className="bg-white shadow-sm backdrop-blur-sm bg-white/90">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            {/* Logo à esquerda com animação hover */}
            <div className="flex items-center transform transition-transform duration-200 hover:scale-105">
              <div className="relative w-[120px] h-[35px]">
                <Image
                  src="/logo principal.webp"
                  alt="Logo"
                  fill
                  sizes="(max-width: 120px) 100vw, 120px"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>

            {/* Selo de segurança à direita */}
            <div className="flex items-center">
              <div className="flex items-center bg-[#f0faf5] rounded-full px-3 py-1.5 transform transition-all duration-200 hover:shadow-sm hover:scale-105">
                <div className="mr-1.5 relative">
                  {/* Círculo de fundo com gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#65D19C] to-[#58b588] rounded-full opacity-20"></div>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#65D19C] relative z-10" />
                </div>
                <span className="text-xs font-medium bg-gradient-to-r from-[#65D19C] to-[#58b588] bg-clip-text text-transparent">
                  Pagamento Seguro
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
