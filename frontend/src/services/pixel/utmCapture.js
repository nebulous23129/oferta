// UTM Parameters capture and storage
const UTM_STORAGE_KEY = 'utm_params';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export const captureUTMParams = () => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {};
  let hasUTMs = false;

  UTM_PARAMS.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      utmParams[param] = value;
      hasUTMs = true;
    }
  });

  if (hasUTMs) {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    return utmParams;
  }

  // Return stored UTMs if available
  const storedUTMs = localStorage.getItem(UTM_STORAGE_KEY);
  return storedUTMs ? JSON.parse(storedUTMs) : null;
};

export const getStoredUTMParams = () => {
  if (typeof window === 'undefined') return null;
  
  const storedUTMs = localStorage.getItem(UTM_STORAGE_KEY);
  return storedUTMs ? JSON.parse(storedUTMs) : null;
};
