import { supabase } from '@/lib/supabase-client';
import { Event } from './utmTrackingAPI';

interface FacebookUserData {
  em?: string[];  // Hashed emails
  ph?: string[];  // Hashed phone numbers
  fn?: string[];  // Hashed first names
  ln?: string[];  // Hashed last names
  ct?: string[];  // Hashed cities
  st?: string[];  // Hashed states
  zp?: string[];  // Hashed zip codes
  country?: string[];  // Hashed countries
  external_id?: string[];  // Hashed external IDs
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;  // Facebook click ID
  fbp?: string;  // Facebook browser ID
}

interface FacebookEventData {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  user_data: FacebookUserData;
  custom_data: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    content_category?: string;
    num_items?: number;
    status?: string;
    [key: string]: any;
  };
  action_source: 'website' | 'mobile_app' | 'email' | 'chat' | 'other';
}

interface FacebookAPIResponse {
  events_received?: number;
  messages?: string[];
  fbtrace_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export class EventRetryService {
  private static instance: EventRetryService;
  private isProcessing: boolean = false;
  private intervalId?: NodeJS.Timeout;

  private readonly FACEBOOK_ACCESS_TOKEN: string;
  private readonly PIXEL_ID: string;
  private readonly FACEBOOK_API_URL: string;
  private readonly RETRY_INTERVAL: number = 60000; // 60 segundos

  private constructor() {
    this.FACEBOOK_ACCESS_TOKEN = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN || '';
    this.PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '';
    this.FACEBOOK_API_URL = `https://graph.facebook.com/v17.0/${this.PIXEL_ID}/events`;
  }

  public static getInstance(): EventRetryService {
    if (!EventRetryService.instance) {
      EventRetryService.instance = new EventRetryService();
    }
    return EventRetryService.instance;
  }

  /**
   * Inicia o serviço de retry de eventos
   */
  public startService(): void {
    if (this.intervalId) {
      console.warn('Serviço de retry já está em execução');
      return;
    }

    console.log('Iniciando serviço de retry de eventos...');
    this.processEvents();
    this.intervalId = setInterval(() => this.processEvents(), this.RETRY_INTERVAL);
  }

  /**
   * Para o serviço de retry de eventos
   */
  public stopService(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Serviço de retry de eventos parado');
    }
  }

  /**
   * Processa eventos pendentes ou falhos
   */
  private async processEvents(): Promise<void> {
    if (this.isProcessing) {
      console.log('Já existe um processamento em andamento');
      return;
    }

    try {
      this.isProcessing = true;
      console.log('Buscando eventos pendentes ou falhos...');

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['pending', 'failed'])
        .order('created_at', { ascending: true })
        .limit(50); // Processa em lotes para evitar sobrecarga

      if (error) throw new Error(`Erro ao buscar eventos: ${error.message}`);

      if (!events?.length) {
        console.log('Nenhum evento pendente ou falho encontrado');
        return;
      }

      console.log(`Processando ${events.length} eventos...`);

      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erro ao processar eventos:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa um único evento
   */
  private async processEvent(event: Event): Promise<void> {
    try {
      const payload = this.buildEventPayload(event);
      const response = await this.sendToFacebookAPI(payload);

      if (response.error) {
        throw new Error(response.error.message);
      }

      await this.updateEventStatus(event.event_id, 'sent', response);
      console.log(`Evento ${event.event_id} processado com sucesso`);
    } catch (err) {
      const error = err as Error;
      console.error(`Erro ao processar evento ${event.event_id}:`, error.message);
      await this.updateEventStatus(event.event_id, 'failed', { error: error.message });
    }
  }

  /**
   * Constrói o payload do evento para a API do Facebook
   */
  private buildEventPayload(event: Event): { data: FacebookEventData[], access_token: string } {
    const eventData: FacebookEventData = {
      event_name: event.event_name,
      event_time: Math.floor(new Date(event.created_at).getTime() / 1000),
      event_id: event.event_id,
      action_source: 'website',
      user_data: this.extractUserData(event),
      custom_data: {
        value: event.value,
        currency: event.currency,
        ...this.extractCustomData(event)
      }
    };

    return {
      data: [eventData],
      access_token: this.FACEBOOK_ACCESS_TOKEN
    };
  }

  /**
   * Extrai dados do usuário do evento
   */
  private extractUserData(event: Event): FacebookUserData {
    const userData = event.additional_data?.user_data || {};
    return {
      ...userData,
      client_ip_address: userData.ip_address,
      client_user_agent: userData.user_agent,
      fbc: userData.fbc,
      fbp: userData.fbp
    };
  }

  /**
   * Extrai dados customizados do evento
   */
  private extractCustomData(event: Event): Record<string, any> {
    return {
      utm_source: event.utm_source,
      utm_medium: event.utm_medium,
      utm_campaign: event.utm_campaign,
      utm_term: event.utm_term,
      ...event.additional_data?.custom_data
    };
  }

  /**
   * Envia evento para a API do Facebook
   */
  private async sendToFacebookAPI(payload: any): Promise<FacebookAPIResponse> {
    const response = await fetch(this.FACEBOOK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.json();
  }

  /**
   * Atualiza o status do evento no banco
   */
  private async updateEventStatus(
    eventId: string,
    status: 'sent' | 'failed',
    response: any
  ): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({
        status,
        api_response: response,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Erro ao atualizar status do evento: ${error.message}`);
    }
  }
}
