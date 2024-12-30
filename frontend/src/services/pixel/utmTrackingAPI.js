import { supabase } from '../supabase';

// Função para gerar UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const saveEvent = async (eventData) => {
  const {
    event_name,
    value,
    currency = 'BRL',
    utmParams,
    customer_id,
    order_id,
    additional_data = {}
  } = eventData;

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        event_id: uuidv4(),
        event_name,
        utm_source: utmParams?.utm_source || null,
        utm_medium: utmParams?.utm_medium || null,
        utm_campaign: utmParams?.utm_campaign || null,
        utm_term: utmParams?.utm_term || null,
        value,
        currency,
        status: 'pending',
        customer_id,
        order_id,
        additional_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving event:', error);
    return null;
  }
};

export const updateEventStatus = async (eventId, status, response) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        status,
        pixel_response: response,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating event status:', error);
    return null;
  }
};
