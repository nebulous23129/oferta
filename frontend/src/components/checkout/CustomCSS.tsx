'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomCSS() {
  const [customCSS, setCustomCSS] = useState<string>('');

  useEffect(() => {
    const fetchCustomCSS = async () => {
      try {
        const { data, error } = await supabase
          .from('checkout_settings')
          .select('custom_css')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar CSS personalizado:', error);
          return;
        }

        if (data?.custom_css) {
          setCustomCSS(data.custom_css);
        }
      } catch (error) {
        console.error('Erro ao carregar CSS personalizado:', error);
      }
    };

    fetchCustomCSS();
  }, []);

  if (!customCSS) return null;

  return (
    <style dangerouslySetInnerHTML={{ __html: customCSS }} />
  );
}
