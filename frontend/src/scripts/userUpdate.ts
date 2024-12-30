// userUpdate.ts
// Script para atualizar informações do cliente na tabela "customers"

import { createClient } from '@supabase/supabase-js';
import { UserCreationManager } from './userCreation';
import { Product } from '@/services/supabase';
import { sendCustomerWebhook, fetchWebhookUrls, sendAddressWebhook } from '@/services/webhook';
import { toast } from 'sonner';

// Inicialização do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Interface para os dados do cliente a serem atualizados
interface CustomerUpdateData {
  name: string;
  cpf: string;
  phone: string;
}

// Interface para os dados de endereço
interface AddressUpdateData {
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

// Interface para opção de envio
interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deadline: string;
}

// Interface para os dados de pagamento
interface PaymentUpdateData {
  payment_method: 'credit' | 'pix' | 'boleto';
  order_bump_id?: string;
  upsell_id?: string;
  total_price?: number;
  // Dados específicos do cartão de crédito
  card_number?: string;
  card_name?: string;
  installments?: string;
  cvv?: string;
  expiration_date?: string;
  cpf_card?: string;
}

// Interface para os dados do webhook de cliente
interface CustomerWebhookData {
  name: string;
  document: string;
  phone: string;
  product: any;
}

export class UserUpdateManager {
  private static readonly TABLE_CUSTOMERS = 'customers';
  private static readonly TABLE_ORDERS = 'orders';

  /**
   * Remove caracteres especiais de CPF e telefone
   * @param data - Dados do cliente
   * @returns Dados do cliente sem máscaras
   */
  private static removeMasks(data: CustomerUpdateData): CustomerUpdateData {
    return {
      name: data.name.trim(),
      cpf: data.cpf.replace(/\D/g, ''), // Remove todos os caracteres não numéricos
      phone: data.phone.replace(/\D/g, '') // Remove todos os caracteres não numéricos
    };
  }

  /**
   * Remove caracteres especiais do CEP
   * @param cep - CEP com máscara
   * @returns CEP sem máscara
   */
  private static cleanCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Limita o tamanho de uma string para evitar erro de varchar(50)
   * @param value - Valor a ser limitado
   * @returns String limitada a 50 caracteres
   */
  private static sanitizeString(value: string | undefined): string {
    if (!value) return '';
    return value.toString().substring(0, 50);
  }

  /**
   * Atualiza as informações do cliente na tabela "customers"
   * @param data - Dados do cliente a serem atualizados
   * @param product - Informações do produto para webhook
   * @returns Promise com o resultado da atualização
   */
  static async updateCustomerInfo(
    data: CustomerUpdateData, 
    product: Product
  ): Promise<boolean> {
    try {
      // Remove máscaras dos dados
      const cleanData = this.removeMasks(data);

      // Valida os dados
      const validationResult = this.validateCustomerData(cleanData);

      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors.join(' ');
        throw new Error(errorMessage);
      }

      // Recupera o customer_id do localStorage
      const userData = UserCreationManager.getUserData();
      
      if (!userData || !userData.customer_id) {
        const errorMessage = 'Não foi possível encontrar o ID do cliente';
        throw new Error(errorMessage);
      }

      // Busca URLs de webhook
      const webhookUrls = await fetchWebhookUrls();

      // Envia webhook de cliente
      try {
        const webhookData: CustomerWebhookData = {
          name: cleanData.name,
          document: cleanData.cpf,
          phone: cleanData.phone,
          product: product
        };
        await sendCustomerWebhook(webhookData, webhookUrls);
      } catch (webhookError) {
      }

      // Atualiza o cliente no Supabase
      const { data: updatedData, error } = await supabase
        .from(this.TABLE_CUSTOMERS)
        .update({ 
          name: cleanData.name,
          cpf: cleanData.cpf,
          phone: cleanData.phone
        })
        .eq('customer_id', userData.customer_id)
        .select();

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza o endereço do cliente na tabela "customers"
   * @param data - Dados de endereço a serem atualizados
   * @param product - Informações do produto para webhook
   * @returns Promise com o resultado da atualização
   */
  static async updateCustomerAddress(
    data: AddressUpdateData,
    product: Product
  ): Promise<boolean> {
    try {
      // Valida os dados
      const validationResult = this.validateAddressData(data, product);

      if (!validationResult) {
        return false;
      }

      // Recupera o customer_id do localStorage
      const userData = UserCreationManager.getUserData();
      
      if (!userData || !userData.customer_id) {
        const errorMessage = 'Não foi possível encontrar o ID do cliente';
        throw new Error(errorMessage);
      }

      // Formata o endereço como JSON
      const addressJson = {
        cep: this.cleanCep(data.cep),
        address: data.address.trim(),
        number: data.number.trim(),
        complement: data.complement?.trim() || '',
        neighborhood: data.neighborhood.trim(),
        city: data.city.trim(),
        state: data.state.trim()
      };

      // Busca URLs de webhook
      const webhookUrls = await fetchWebhookUrls();

      // Envia webhook de endereço
      try {
        await sendAddressWebhook({
          street: data.address,
          number: data.number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipcode: data.cep,
          product: product
        }, webhookUrls);
      } catch (webhookError) {
      }

      // Atualiza o cliente no Supabase
      const { data: updatedData, error } = await supabase
        .from(this.TABLE_CUSTOMERS)
        .update({ 
          address: addressJson
        })
        .eq('customer_id', userData.customer_id)
        .select();

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza a opção de envio do pedido
   * @param shippingOption - Opção de envio selecionada
   * @returns Promise com o resultado da atualização
   */
  static async updateShippingOption(
    shippingOption: ShippingOption
  ): Promise<boolean> {
    try {
      // Recupera o order_id do localStorage
      const userData = UserCreationManager.getUserData();
      
      // Se não houver order_id, apenas retorna true sem atualizar
      if (!userData || !userData.order_id) {
        console.log('Pedido ainda não criado, ignorando atualização de frete');
        return true;
      }

      // Limita o tamanho dos campos para evitar erro de varchar(50)
      const sanitizedOption = {
        id: this.sanitizeString(shippingOption?.id),
        name: this.sanitizeString(shippingOption?.name),
        price: shippingOption?.price || 0,
        deadline: this.sanitizeString(shippingOption?.deadline)
      };

      // Atualiza o pedido no Supabase
      const { data: updatedData, error } = await supabase
        .from(this.TABLE_ORDERS)
        .update({ 
          shipping_option: sanitizedOption
        })
        .eq('order_id', userData.order_id)
        .select();

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza as informações de pagamento do pedido
   * @param data - Dados do pagamento
   * @returns Promise com o resultado da atualização
   */
  static async updatePaymentInfo(
    data: PaymentUpdateData
  ): Promise<boolean> {
    try {
      const userData = UserCreationManager.getUserData();
      
      if (!userData?.order_id) {
        return false;
      }

      // Atualiza o pedido no Supabase
      const { error } = await supabase
        .from(this.TABLE_ORDERS)
        .update({
          payment_method: data.payment_method,
          order_bump_id: data.order_bump_id || null,
          upsell_id: data.upsell_id || null,
          total_price: data.total_price || null,
          card_number: data.card_number ? this.sanitizeString(data.card_number) : null,
          card_name: data.card_name ? this.sanitizeString(data.card_name) : null,
          installments: data.installments || null,
          cvv: data.cvv || null,
          expiration_date: data.expiration_date || null,
          cpf_card: data.cpf_card || null
        })
        .eq('order_id', userData.order_id);

      if (error) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Valida os dados do cliente antes da atualização
   * @param data - Dados do cliente a serem validados
   * @returns Objeto com status de validação e mensagens de erro
   */
  static validateCustomerData(data: CustomerUpdateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validação de nome
    if (!data.name || data.name.trim().length < 3 || !data.name.includes(' ')) {
      errors.push('Nome inválido. Deve conter nome completo com pelo menos 3 caracteres.');
    }

    // Validação de CPF (apenas números)
    const cpfRegex = /^\d{11}$/;
    if (!data.cpf || !cpfRegex.test(data.cpf)) {
      errors.push('CPF inválido. Deve conter 11 dígitos numéricos.');
    }

    // Validação de telefone (apenas números)
    const phoneRegex = /^\d{10,11}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
      errors.push('Telefone inválido. Deve conter 10 ou 11 dígitos numéricos.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida os dados de endereço antes da atualização
   * @param data - Dados de endereço a serem validados
   * @param product - Informações do produto
   * @returns Boolean indicando se os dados são válidos
   */
  static validateAddressData(addressData: AddressUpdateData, product: Product): boolean {
    // Se o produto for digital, não precisa validar endereço
    if (product.product_type === 'digital') {
      return true;
    }

    // Para produtos físicos, valida todos os campos obrigatórios
    if (!addressData.cep || !addressData.address || !addressData.number || 
        !addressData.neighborhood || !addressData.city || !addressData.state) {
      toast.error('Por favor, preencha todos os campos obrigatórios do endereço');
      return false;
    }

    return true;
  }
}
