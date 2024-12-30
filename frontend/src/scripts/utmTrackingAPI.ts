import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase-client';

// Interfaces
export interface EventData {
  user_id?: string;
  session_id?: string;
  event_name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  value?: number;
  currency?: string;
  additional_data?: any;
}

export interface Event {
  id: number;
  event_id: string;
  user_id?: string;
  session_id?: string;
  event_name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  value?: number;
  currency: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'sent' | 'failed';
  pixel_response?: any;
  api_response?: any;
  additional_data?: any;
}

export class UTMTrackingAPI {
  /**
   * Salva um evento no banco de dados
   * @param eventData Dados do evento a ser salvo
   * @returns Promise com o ID do evento criado
   */
  static async saveEvent(eventData: EventData): Promise<{ event_id: string; data: any } | null> {
    try {
      // Validação básica
      if (!eventData.event_name) {
        throw new Error('O campo event_name é obrigatório.');
      }

      // Gerar um UUID para o evento
      const event_id = uuidv4();

      // Preparar dados para inserção
      const eventRecord = {
        event_id,
        user_id: eventData.user_id || null,
        session_id: eventData.session_id || null,
        event_name: eventData.event_name,
        utm_source: eventData.utm_source || null,
        utm_medium: eventData.utm_medium || null,
        utm_campaign: eventData.utm_campaign || null,
        utm_term: eventData.utm_term || null,
        value: eventData.value || null,
        currency: eventData.currency || 'BRL',
        status: 'pending',
        additional_data: eventData.additional_data || null,
      };

      // Inserir no Supabase
      const { data, error } = await supabase
        .from('events')
        .insert([eventRecord])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar evento:', error);
        throw error;
      }

      return { event_id, data };
    } catch (error) {
      console.error('Erro ao processar evento:', error);
      return null;
    }
  }

  /**
   * Recupera eventos por status
   * @param status Status dos eventos a serem recuperados
   * @returns Promise com a lista de eventos
   */
  static async getEventsByStatus(status: 'pending' | 'sent' | 'failed' = 'pending'): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao recuperar eventos:', error);
      return [];
    }
  }

  /**
   * Atualiza o status de um evento
   * @param event_id ID do evento
   * @param status Novo status
   * @param response Resposta da API (opcional)
   * @returns Promise com o resultado da atualização
   */
  static async updateEventStatus(
    event_id: string,
    status: 'pending' | 'sent' | 'failed',
    response?: any
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Adiciona a resposta apropriada baseada no tipo
      if (response) {
        if (status === 'sent') {
          updateData.pixel_response = response;
        } else {
          updateData.api_response = response;
        }
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('event_id', event_id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do evento:', error);
      return false;
    }
  }

  /**
   * Recupera um evento específico por ID
   * @param event_id ID do evento
   * @returns Promise com o evento encontrado
   */
  static async getEventById(event_id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', event_id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao recuperar evento:', error);
      return null;
    }
  }

  /**
   * Recupera eventos pendentes que precisam ser reprocessados
   * @param limit Limite de eventos a serem recuperados
   * @returns Promise com a lista de eventos pendentes
   */
  static async getPendingEvents(limit: number = 10): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao recuperar eventos pendentes:', error);
      return [];
    }
  }
}
