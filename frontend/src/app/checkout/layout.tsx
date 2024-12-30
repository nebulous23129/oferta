'use client';

import { useEffect } from 'react';
import { initializePixel } from '@/services/pixel/pixelEvents';
import { captureUTMParams } from '@/services/pixel/utmCapture';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize Facebook Pixel
    initializePixel();
    // Capture UTM parameters
    captureUTMParams();
  }, []);

  return <>{children}</>;
}
