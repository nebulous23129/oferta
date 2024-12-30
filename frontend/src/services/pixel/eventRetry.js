const RETRY_QUEUE_KEY = 'fb_pixel_retry_queue';
const MAX_RETRIES = 3;

export const queueFailedEvent = (eventName, eventData) => {
  if (typeof window === 'undefined') return;

  const queue = JSON.parse(localStorage.getItem(RETRY_QUEUE_KEY) || '[]');
  queue.push({
    eventName,
    eventData,
    retryCount: 0,
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
};

export const retryFailedEvents = () => {
  if (typeof window === 'undefined' || typeof fbq === 'undefined') return;

  const queue = JSON.parse(localStorage.getItem(RETRY_QUEUE_KEY) || '[]');
  const updatedQueue = [];

  queue.forEach(event => {
    if (event.retryCount < MAX_RETRIES) {
      try {
        fbq('track', event.eventName, event.eventData);
      } catch (error) {
        event.retryCount++;
        updatedQueue.push(event);
      }
    }
  });

  localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(updatedQueue));
};
