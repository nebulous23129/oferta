import ReactPixel from 'react-facebook-pixel';
import { getStoredUTM } from './utmCapture';
import { UTMTrackingAPI } from './utmTrackingAPI';

// Interfaces
interface PixelEventData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
  content_category?: string;
  transaction_id?: string;
  num_items?: number;
  [key: string]: any;
}

interface EnrichedEventData extends PixelEventData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_token?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
}

type PixelEventName = 
  | 'PageView'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'ViewContent'
  | 'AddToCart'
  | string;

/**
 * Inicializa o Pixel do Facebook
 * @param pixelId ID do pixel do Facebook
 */
export const initializePixel = (pixelId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    ReactPixel.init(pixelId, {
      autoConfig: true,
      debug: process.env.NODE_ENV === 'development'
    });
    console.log('Pixel inicializado:', pixelId);

    // Envia evento de PageView automaticamente
    ReactPixel.pageView();
  } catch (error) {
    console.error('Erro ao inicializar o Pixel:', error);
  }
};

/**
 * Função genérica para disparar eventos do Pixel
 * @param eventName Nome do evento
 * @param eventData Dados do evento
 */
export const trackPixelEvent = async (
  eventName: PixelEventName,
  eventData: PixelEventData = {}
): Promise<void> => {
  try {
    // Obtém UTMs armazenadas
    const utmData = getStoredUTM();

    // Enriquece os dados do evento com UTMs
    const enrichedEventData: EnrichedEventData = {
      ...eventData,
      utm_source: utmData?.utm_source || null,
      utm_medium: utmData?.utm_medium || null,
      utm_campaign: utmData?.utm_campaign || null,
      utm_term: utmData?.utm_term || null,
      utm_token: utmData?.utm_token || null,
      fbclid: utmData?.fbclid || null,
      gclid: utmData?.gclid || null,
      ttclid: utmData?.ttclid || null,
    };

    // Dispara o evento para o Pixel
    if (typeof window !== 'undefined') {
      ReactPixel.track(eventName, enrichedEventData);
    }

    // Salva o evento no banco de dados
    await UTMTrackingAPI.saveEvent({
      event_name: eventName,
      utm_source: enrichedEventData.utm_source || undefined,
      utm_medium: enrichedEventData.utm_medium || undefined,
      utm_campaign: enrichedEventData.utm_campaign || undefined,
      utm_term: enrichedEventData.utm_term || undefined,
      value: eventData.value,
      currency: eventData.currency,
      additional_data: {
        ...enrichedEventData,
        pixel_event_data: eventData
      }
    });

    console.log(`Evento disparado: ${eventName}`, enrichedEventData);
  } catch (error) {
    console.error(`Erro ao disparar evento ${eventName}:`, error);
  }
};

/**
 * Rastreia o início do checkout
 * @param data Dados do evento
 */
export const trackInitiateCheckout = (data: PixelEventData = {}): void => {
  trackPixelEvent('InitiateCheckout', {
    currency: 'BRL',
    ...data
  });
};

/**
 * Rastreia a adição de informações de pagamento
 * @param data Dados do evento
 */
export const trackAddPaymentInfo = (data: PixelEventData = {}): void => {
  trackPixelEvent('AddPaymentInfo', {
    currency: 'BRL',
    ...data
  });
};

/**
 * Rastreia uma compra finalizada
 * @param data Dados do evento
 */
export const trackPurchase = (data: PixelEventData = {}): void => {
  if (!data.transaction_id) {
    console.warn('trackPurchase: transaction_id não fornecido');
  }

  trackPixelEvent('Purchase', {
    currency: 'BRL',
    ...data
  });
};

/**
 * Rastreia a visualização de um produto
 * @param data Dados do evento
 */
export const trackViewContent = (data: PixelEventData = {}): void => {
  trackPixelEvent('ViewContent', {
    currency: 'BRL',
    ...data
  });
};

/**
 * Rastreia a adição de um produto ao carrinho
 * @param data Dados do evento
 */
export const trackAddToCart = (data: PixelEventData = {}): void => {
  trackPixelEvent('AddToCart', {
    currency: 'BRL',
    ...data
  });
};
