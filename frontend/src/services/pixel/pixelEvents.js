import { getStoredUTMParams } from './utmCapture';
import { saveEvent, updateEventStatus } from './utmTrackingAPI';

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

let isInitialized = false;

export const initializePixel = () => {
  if (typeof window === 'undefined' || isInitialized) return;

  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', FB_PIXEL_ID);
  isInitialized = true;
};

const trackEvent = async (eventName, data = {}) => {
  if (typeof fbq === 'undefined') {
    console.error('Facebook Pixel não está inicializado');
    return;
  }

  const utmParams = getStoredUTMParams();
  
  // Salva o evento no banco de dados
  const eventData = {
    event_name: eventName,
    value: data.value,
    currency: data.currency || 'BRL',
    utmParams,
    customer_id: data.customer_id,
    order_id: data.order_id,
    additional_data: data
  };

  const savedEvent = await saveEvent(eventData);

  // Envia o evento para o Facebook Pixel
  fbq('track', eventName, data);

  // Atualiza o status do evento
  if (savedEvent) {
    await updateEventStatus(savedEvent.id, 'sent', { success: true });
  }
};

export const trackInitiateCheckout = (data = {}) => {
  trackEvent('InitiateCheckout', data);
};

export const trackPurchase = (data = {}) => {
  trackEvent('Purchase', data);
};

export const trackCompleteRegistration = (data = {}) => {
  console.log('Iniciando trackCompleteRegistration com dados:', data);
  trackEvent('CompleteRegistration', data);
};

export const trackAddPaymentInfo = (data = {}) => {
  trackEvent('AddPaymentInfo', data);
};

export const trackViewContent = (data = {}) => {
  trackEvent('ViewContent', data);
};

export const trackAddToCart = (data = {}) => {
  trackEvent('AddToCart', data);
};
