// userCreation.ts
// Script para gerenciar a criação de usuário usando o email capturado no checkout

import { createClient } from '@supabase/supabase-js';

// Inicialização do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserCreationScript {
  email: string;
  timestamp: string;
  customer_id?: string;
  product_id?: string;
  order_id?: string;
}

export class UserCreationManager {
  private static readonly STORAGE_KEY = 'checkout_email_data';
  private static readonly TABLE_CUSTOMERS = 'customers';
  private static readonly TABLE_ORDERS = 'orders';

  /**
   * Salva o email do usuário no localStorage e cria no Supabase
   * @param email - Email do usuário capturado no checkout
   * @param product_id - ID do produto sendo comprado
   */
  static async saveUserEmail(email: string, product_id: string): Promise<string> {
    try {
      // Validação básica dos dados recebidos
      if (!email || !product_id) {
        throw new Error('Email e product_id são obrigatórios');
      }

      // Cria ou recupera o cliente no Supabase
      const customer_id = await this.createCustomerInSupabase(email);
      
      // Cria o pedido no Supabase
      const order_id = await this.createOrderInSupabase(customer_id, product_id);
      
      // Salva no localStorage com o customer_id e order_id
      const userData: UserCreationScript = {
        email,
        timestamp: new Date().toISOString(),
        customer_id,
        product_id,
        order_id
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));

      return order_id;
    } catch (error) {
      console.error(' Erro na criação do usuário:', error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }

  /**
   * Cria ou recupera um cliente no Supabase
   * @param email - Email do cliente
   */
  private static async createCustomerInSupabase(email: string): Promise<string> {
    try {
      // Busca cliente existente
      const { data: existingCustomer, error: searchError } = await supabase
        .from(this.TABLE_CUSTOMERS)
        .select('customer_id')
        .eq('email', email)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      // Se o cliente já existe, retorna o ID
      if (existingCustomer) {
        return existingCustomer.customer_id;
      }

      // Cria novo cliente
      const { data: newCustomer, error: insertError } = await supabase
        .from(this.TABLE_CUSTOMERS)
        .insert([{ email }])
        .select('customer_id')
        .single();

      if (insertError) {
        throw insertError;
      }

      return newCustomer.customer_id;
    } catch (error) {
      console.error(' Erro no processo de criação/recuperação do cliente:', error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }

  /**
   * Cria um novo pedido no Supabase
   * @param customer_id - ID do cliente
   * @param product_id - ID do produto
   */
  private static async createOrderInSupabase(customer_id: string, product_id: string): Promise<string> {
    try {
      const { data: order, error } = await supabase
        .from(this.TABLE_ORDERS)
        .insert([{
          customer_id,
          product_id,
          status: 'aguardando'
        }])
        .select('order_id')
        .single();

      if (error) {
        throw error;
      }

      return order.order_id;
    } catch (error) {
      console.error(' Erro no processo de criação do pedido:', error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }

  /**
   * Recupera os dados do usuário do localStorage
   */
  static getUserData(): UserCreationScript | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(' Erro ao recuperar dados do usuário:', error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    }
  }
}
