// Interfaces para tipagem
interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  utm_token: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
}

/**
 * Gera um token único para identificar a sessão do usuário
 * @returns string - Token único
 */
const generateUTMToken = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Captura os parâmetros UTM da URL e armazena no localStorage
 * @returns UTMParams - Objeto com os parâmetros UTM capturados
 */
export const captureUTM = (): UTMParams => {
  // Verifica se window está definido (Next.js SSR check)
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      utm_token: null,
      fbclid: null,
      gclid: null,
      ttclid: null,
    };
  }

  // Captura os parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);

  // Captura parâmetros de rastreamento específicos de plataformas
  const fbclid = urlParams.get('fbclid');
  const gclid = urlParams.get('gclid');
  const ttclid = urlParams.get('ttclid');

  // Recupera UTMs existentes ou cria novos
  const existingUTMs = getStoredUTM();
  const utmToken = existingUTMs?.utm_token || generateUTMToken();

  // Define os parâmetros UTM
  const utmParams: UTMParams = {
    utm_source: urlParams.get('utm_source') || existingUTMs?.utm_source || null,
    utm_medium: urlParams.get('utm_medium') || existingUTMs?.utm_medium || null,
    utm_campaign: urlParams.get('utm_campaign') || existingUTMs?.utm_campaign || null,
    utm_term: urlParams.get('utm_term') || existingUTMs?.utm_term || null,
    utm_content: urlParams.get('utm_content') || existingUTMs?.utm_content || null,
    utm_token: utmToken,
    fbclid: fbclid || existingUTMs?.fbclid || null,
    gclid: gclid || existingUTMs?.gclid || null,
    ttclid: ttclid || existingUTMs?.ttclid || null,
  };

  // Armazena as UTMs no Local Storage apenas se houver algum valor
  if (Object.values(utmParams).some(value => value !== null)) {
    localStorage.setItem('utm_data', JSON.stringify(utmParams));
  }

  return utmParams;
};

/**
 * Recupera as UTMs armazenadas no localStorage
 * @returns UTMParams | null - Objeto com os parâmetros UTM ou null se não existir
 */
export const getStoredUTM = (): UTMParams | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUTM = localStorage.getItem('utm_data');
    return storedUTM ? JSON.parse(storedUTM) : null;
  } catch (error) {
    console.error('Erro ao recuperar UTMs:', error);
    return null;
  }
};

/**
 * Limpa as UTMs armazenadas no localStorage
 */
export const clearUTM = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('utm_data');
};

/**
 * Verifica se existem UTMs válidas armazenadas
 * @returns boolean - true se existirem UTMs válidas
 */
export const hasValidUTM = (): boolean => {
  const utmData = getStoredUTM();
  return Boolean(utmData && Object.values(utmData).some(value => value !== null));
};
