import React from 'react';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-white py-6 mt-auto border-t">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="relative w-[280px] h-[80px]">
            <Image
              src="/logoprincipal.webp"
              alt="Mercado Pago Secure"
              fill
              sizes="(max-width: 280px) 100vw, 280px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
