  'use client'

  import { useState, useEffect, useCallback, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, SetStateAction } from 'react'
  import Image from "next/image"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Card, CardContent } from "@/components/ui/card"
  import { Minus, Plus, CreditCard, Banknote } from 'lucide-react'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import Header from '@/components/checkout/Header'
  import OrderSummary from '@/components/checkout/OrderSummary'
  import Footer from '@/components/checkout/Footer'
  import CustomCSS from '@/components/checkout/CustomCSS'
  import { getProduct, type Product } from '@/services/supabase'
  import { Offer } from './offers';
  import { 
    sendEmailWebhook, 
    sendCustomerWebhook, 
    sendAddressWebhook, 
    sendPaymentWebhook,
    fetchWebhookUrls,
    sendN8NWebhook
  } from '@/services/webhook'
  import { toast } from 'sonner'
  import { supabase } from '@/lib/supabase'
  import { RadioGroup, RadioGroupItem, Label } from "@/components/ui/radio-group";
  import { Barcode } from 'lucide-react';
  import { cn } from "@/lib/utils";
  import { Lock } from 'lucide-react';
  import { ArrowLeft, Mail } from 'lucide-react';
  import { Check } from 'lucide-react';
  import { MapPin } from 'lucide-react';
  import { Pencil } from 'lucide-react';
  import { Trash2 } from 'lucide-react';
  import { getOffers } from './offers';
  import { UserCreationManager } from '@/scripts/userCreation';
  import { UserUpdateManager } from '@/scripts/userUpdate';
  import { formatCurrency } from '@/components/checkout/OrderSummary';
  import { trackInitiateCheckout, trackPurchase } from '@/services/pixel/pixelEvents';

  interface FormData {
    email: string
    name: string
    cpf: string
    phone: string
    cep: string
    address: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    paymentMethod: 'credit' | 'pix' | 'boleto'
    cardNumber: string
    cardExpMonth: string
    cardExpYear: string
    cardCvv: string
    cardName: string
    installments: string
    savedAddress: boolean
    recipient: string
  }

  interface ShippingOption {
    id: string;
    name: string;
    price: number;
    deadline: string;
  }

  // Hook personalizado para gerenciar estado assíncrono
  function useAsyncAction<T>(
    action: () => Promise<T>, 
    onSuccess?: (result: T) => void, 
    onError?: (error: Error) => void
  ) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await action();
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    }, [action, onSuccess, onError]);

    return { execute, isLoading, error };
  }

  // Componente de Servidor para buscar o produto
  async function ProductFetcher({ productId }: { productId: string }) {
    try {
      const product = await getProduct(productId);

      if (!product) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
              <p className="text-gray-600">O produto que você está procurando não existe ou foi removido.</p>
            </div>
          </div>
        );
      }

      return <CheckoutPageContent product={product} />;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar produto</h1>
            <p className="text-gray-600">Ocorreu um erro ao carregar o produto. Por favor, tente novamente.</p>
          </div>
        </div>
      );
    }
  }

  // Componente de Cliente para o conteúdo do checkout
  function CheckoutPageContent({ product }: { product: Product }) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<FormData>({
      email: '',
      name: '',
      cpf: '',
      phone: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      paymentMethod: 'pix',
      cardNumber: '',
      cardExpMonth: '',
      cardExpYear: '',
      cardCvv: '',
      cardName: '',
      installments: '',
      savedAddress: false,
      recipient: ''
    })

    const [quantity, setQuantity] = useState(1)
    const [orderBumpSelected, setOrderBumpSelected] = useState(false)
    const [upsellSelected, setUpsellSelected] = useState(false)
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

    const [showAddressFields, setShowAddressFields] = useState(false)
    const [showSaveButton, setShowSaveButton] = useState(false)
    const [orderTotal, setOrderTotal] = useState(0)
    const [discountedTotal, setDiscountedTotal] = useState(0)
    const [baseTotal, setBaseTotal] = useState(0);

    // Interface para os descontos por forma de pagamento
    interface PaymentDiscount {
      method: 'credit' | 'pix' | 'boleto';
      percentage: number;
      active: boolean;
    }

    // Estado para armazenar os descontos das formas de pagamento
    // TODO: Substituir por chamada ao Supabase
    const [paymentDiscounts, setPaymentDiscounts] = useState<PaymentDiscount[]>([
      { method: 'credit', percentage: 5, active: true },
      { method: 'pix', percentage: 5, active: true },
      { method: 'boleto', percentage: 5, active: true }
    ]);

    // Função para buscar descontos do Supabase
    const fetchPaymentDiscounts = async () => {
      // TODO: Implementar chamada ao Supabase
      // const { data, error } = await supabase
      //   .from('payment_discounts')
      //   .select('*')
      //   .eq('active', true);
      // if (data) setPaymentDiscounts(data);
    };

    // Função para calcular o valor do desconto
    const calculateDiscountValue = (method: 'credit' | 'pix' | 'boleto') => {
      let discountPercentage = 0;
      
      switch (method) {
        case 'credit':
          discountPercentage = product.card_discount || 0;
          break;
        case 'pix':
          discountPercentage = product.pix_discount || 0;
          break;
        case 'boleto':
          discountPercentage = product.boleto_discount || 0;
          break;
      }
      
      return (orderTotal * (discountPercentage / 100));
    };

    // Função auxiliar para renderizar a tag de desconto
    const renderDiscountTag = (method: 'credit' | 'pix' | 'boleto') => {
      let discountPercentage = 0;
      
      switch (method) {
        case 'credit':
          discountPercentage = product.card_discount || 0;
          break;
        case 'pix':
          discountPercentage = product.pix_discount || 0;
          break;
        case 'boleto':
          discountPercentage = product.boleto_discount || 0;
          break;
      }

      if (discountPercentage <= 0) return null;

      // Calcula o valor economizado usando orderTotal
      const savings = (orderTotal * (discountPercentage / 100));

      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <div className="flex flex-col items-end">
            <div className="bg-green-600 text-green-50 text-[10px] font-medium px-2 py-0.5 rounded">
              {discountPercentage}% OFF
            </div>
            <div className="text-[10px] text-green-600">
              Economia de R$ {formatCurrency(savings)}
            </div>
          </div>
        </div>
      );
    };

    const [addressFieldsDisabled, setAddressFieldsDisabled] = useState(false);

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
      const cep = e.target.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              address: data.logradouro || '',
              neighborhood: data.bairro || '',
              city: data.localidade || '',
              state: data.uf || ''
            }));
            setShowAddressFields(true);
            setShowSaveButton(true);
            setAddressFieldsDisabled(true);
          } else {
            setShowAddressFields(true);
            setAddressFieldsDisabled(false);
            setShowSaveButton(true);
            setFormData(prev => ({
              ...prev,
              address: '',
              neighborhood: '',
              city: '',
              state: ''
            }));
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
          setShowAddressFields(true);
          setAddressFieldsDisabled(false);
          setShowSaveButton(true);
          setFormData(prev => ({
            ...prev,
            address: '',
            neighborhood: '',
            city: '',
            state: ''
          }));
        }
      }
    };

    const handleSaveAddress = () => {
      if (validateAddress()) {
        setFormData(prev => ({ ...prev, savedAddress: true }));
        setShowSaveButton(false);
      }
    }

    const handleEditAddress = () => {
      setFormData(prev => ({ ...prev, savedAddress: false }));
      setShowSaveButton(true);
    }

    const handleDeleteAddress = () => {
      setFormData(prev => ({
        ...prev,
        savedAddress: false,
        cep: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      }));
      setShowAddressFields(false);
      setShowSaveButton(false);
    }

    const handleNewAddress = () => {
      setFormData(prev => ({
        ...prev,
        savedAddress: false,
        cep: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      }));
      setShowAddressFields(false);
      setShowSaveButton(false);
    }

    // Hook para buscar URLs dos webhooks
    const { execute: loadWebhookUrls, isLoading: isLoadingUrls } = useAsyncAction(
      async () => {
        const urls = await fetchWebhookUrls();
        return urls;
      },
      (urls) => {
        const missingUrls = Object.entries(urls)
          .filter(([_, value]) => !value)
          .map(([key]) => key);

        if (missingUrls.length > 0) {
          toast.warning('Algumas URLs de webhook não estão configuradas', {
            description: `URLs faltando: ${missingUrls.join(', ')}`
          });
        }
        return urls;
      }
    );

    // Carregar URLs dos webhooks ao montar o componente
    const [webhookUrls, setWebhookUrls] = useState<any>(null);
    useEffect(() => {
      loadWebhookUrls().then(setWebhookUrls);
    }, []);

    // Taxas de juros por parcela
    const installmentRates = {
      '1': 5.29,
      '2': 8.31,
      '3': 9.48,
      '4': 10.65,
      '5': 11.82,
      '6': 12.99,
      '7': 15.18,
      '8': 16.35,
      '9': 17.52,
      '10': 18.69,
      '11': 19.86,
      '12': 21.03
    }

    // Função para calcular o valor da parcela com juros
    const calculateInstallmentValue = (price: number, installments: number) => {
      // Até 5x sem juros
      if (installments <= 5) {
        return price / installments
      }
      // Acima de 5x com juros
      const rate = installmentRates[installments as unknown as keyof typeof installmentRates] / 100
      const totalAmount = price * (1 + rate)
      return totalAmount / installments
    }

    // Validações por step
    const validateEmail = async () => {
      if (!formData.email) {
        toast.error('Por favor, preencha o e-mail');
        return false;
      }
      
      try {
        // Salvar email para o script de criação de usuário
        await UserCreationManager.saveUserEmail(formData.email, product.product_id);
        return true;
      } catch (error) {
        console.error('Erro ao salvar email:', error);
        toast.error('Erro ao salvar email. Por favor, tente novamente.');
        return false;
      }
    };

    const validateCustomer = () => {
      if (!formData.name || !formData.cpf || !formData.phone) {
        toast.error('Por favor, preencha todos os campos do cliente');
        return false;
      }
      return true;
    };

    const validateAddress = () => {
      if (!formData.cep || !formData.address || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
        toast.error('Por favor, preencha os campos obrigatórios do endereço');
        return false;
      }
      return true;
    };

    const validatePayment = () => {
      if (!formData.paymentMethod) {
        toast.error('Selecione uma forma de pagamento');
        return false;
      }

      // Para produtos físicos, valida o endereço
      if (product.product_type === 'physical') {
        if (!formData.cep || !formData.address || !formData.number || 
            !formData.neighborhood || !formData.city || !formData.state) {
          toast.error('Por favor, preencha o endereço de entrega');
          return false;
        }
      }

      if (formData.paymentMethod === 'credit') {
        if (!formData.cardNumber || !formData.cardName || !formData.cardExpMonth || 
            !formData.cardExpYear || !formData.cardCvv) {
          toast.error('Preencha todos os dados do cartão');
          return false;
        }
      }

      return true;
    };

    // Funções de validação
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const isValidCpf = (cpf: string) => {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      return cpfRegex.test(cpf);
    };

    const isValidPhone = (phone: string) => {
      const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
      return phoneRegex.test(phone);
    };

    const isValidName = (name: string) => {
      return name.trim().length >= 3 && name.includes(' ');
    };

    // Hooks para ações assíncronas de cada etapa
    const { execute: handleEmailSubmit, isLoading: isSubmittingEmail } = useAsyncAction(
      async () => {
        if (!await validateEmail()) return;
        await sendEmailWebhook(formData.email, product, webhookUrls);
        setCurrentStep(2);
        //toast.success('Email validado com sucesso!');
      }
    );

    const { execute: handleCustomerSubmit, isLoading: isSubmittingCustomer } = useAsyncAction(
      async () => {
        if (!validateCustomer()) return;
        try {
          // Atualiza as informações do cliente
          await UserUpdateManager.updateCustomerInfo({
            name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone
          }, product);

          // Se o produto for digital, pula direto para a etapa de pagamento
          if (product.product_type === 'digital') {
            setCurrentStep(4);
          } else {
            setCurrentStep(3);
          }
        } catch (error) {
          console.error('Erro ao salvar informações do cliente:', error);
          toast.error('Erro ao salvar informações do cliente');
        }
      }
    );

    const { execute: handleAddressSubmit, isLoading: isSubmittingAddress } = useAsyncAction(
      async () => {
        if (!validateAddress()) return;
        
        // Se não tem opção selecionada
        if (!selectedShipping) {
          toast.error('Selecione uma opção de envio');
          return;
        }

        try {
          // Atualiza o endereço
          await UserUpdateManager.updateCustomerAddress({
            cep: formData.cep,
            address: formData.address,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state
          }, product);

          // Atualiza a opção de envio selecionada (que pode ser grátis)
          await UserUpdateManager.updateShippingOption(selectedShipping);

          setCurrentStep(4);
        } catch (error) {
          console.error('Erro ao salvar endereço e opção de envio:', error);
        }
      }
    );

    const { execute: handlePaymentSubmit, isLoading: isSubmittingPayment } = useAsyncAction(
      async () => {
        if (!validatePayment()) return;
        try {
          const userData = UserCreationManager.getUserData();
          if (!userData?.order_id) {
            toast.error('ID do pedido não encontrado');
            return;
          }

          // Atualiza as informações de pagamento
          const paymentData = {
            payment_method: formData.paymentMethod,
            total_price: discountedTotal,
            card_number: formData.cardNumber,
            card_name: formData.cardName,
            cvv: formData.cardCvv,
            expiration_date: `${formData.cardExpMonth}/${formData.cardExpYear}`,
            cpf_card: formData.cpf
          };

          const success = await UserUpdateManager.updatePaymentInfo(paymentData);

          if (success) {
            // Prepara os dados completos para o webhook
            const webhookData = {
              order: {
                order_id: userData.order_id,
                customer_id: userData.customer_id,
                total_price: discountedTotal,
                payment_method: formData.paymentMethod,
                status: 'pending'
              },
              customer: {
                id: userData.customer_id,
                name: formData.name,
                email: formData.email,
                cpf: formData.cpf,
                phone: formData.phone
              },
              product: {
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category || 'No Category',
                type: product.product_type
              },
              shipping: product.product_type === 'physical' ? {
                address: {
                  cep: formData.cep,
                  street: formData.address,
                  number: formData.number,
                  complement: formData.complement,
                  neighborhood: formData.neighborhood,
                  city: formData.city,
                  state: formData.state
                },
                option: selectedShipping
              } : null,
              payment: {
                ...paymentData,
                card_number: formData.cardNumber ? `**** **** **** ${formData.cardNumber.slice(-4)}` : null
              },
              metadata: {
                timestamp: new Date().toISOString(),
                source: 'checkout7pay',
                environment: process.env.NODE_ENV
              }
            };

            // Envia o webhook para o n8n
            try {
              await sendN8NWebhook(webhookData);
            } catch (error) {
              console.error('Erro ao enviar webhook para n8n:', error);
              // Não bloqueia o fluxo em caso de erro no webhook
            }

            // Track purchase event
            trackPurchase({
              value: discountedTotal,
              currency: 'BRL',
              content_type: 'product',
              content_ids: [product.id],
              content_name: product.name,
              content_category: product.category || 'No Category',
              num_items: 1,
              customer_id: userData.customer_id,
              order_id: userData.order_id
            });
            
            // Redireciona para a página de status
            window.location.href = `/statusdopedido?orderId=${userData.order_id}`;
          }
        } catch (error) {
          console.error('Erro ao processar pagamento:', error);
          toast.error('Erro ao processar pagamento');
        }
      }
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }))
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === 'paymentMethod') {
        // Validação do tipo de pagamento
        if (value === 'credit' || value === 'pix' || value === 'boleto') {
          setFormData(prev => ({ ...prev, paymentMethod: value as 'credit' | 'pix' | 'boleto' }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }

    const handleContinue = async () => {
      if (isSubmittingEmail || isSubmittingCustomer || isSubmittingAddress || isSubmittingPayment) {
        return; // Evita múltiplos cliques durante o processamento
      }

      switch(currentStep) {
        case 1: // Email
          await handleEmailSubmit();
          break;
        case 2: // Customer
          await handleCustomerSubmit();
          break;
        case 3: // Address
          await handleAddressSubmit();
          break;
        case 4: // Payment
          await handlePaymentSubmit();
          break;
      }
    }

    const getStepTitle = () => {
      switch(currentStep) {
        case 1:
          return {
            number: '1',
            title: 'Identifique-se',
            description: 'Utilizaremos seu e-mail para: Identificar seu perfil, histórico de compra, notificação de pedidos e carrinho de compras.'
          };
        case 2:
          return {
            number: '1',
            title: 'Identifique-se',
            description: 'Utilizaremos seu e-mail para: Identificar seu perfil, histórico de compra, notificação de pedidos e carrinho de compras.'
          };
        case 3:
          return {
            number: '2',
            title: 'Entrega',
            description: 'Cadastre ou selecione um endereço'
          };
        case 4:
          return {
            number: '3',
            title: 'Pagamento',
            description: 'Escolha uma forma de pagamento'
          };
        default:
          return {
            number: '',
            title: '',
            description: ''
          };
      }
    }

    const getVisualStep = () => {
      // Mapeia os 4 steps internos para 3 steps visuais
      switch(currentStep) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 3:
        case 4:
          return 3;
        default:
          return 1;
      }
    }

    const isStepLoading = () => {
      switch(currentStep) {
        case 1:
          return isSubmittingEmail;
        case 2:
          return isSubmittingCustomer;
        case 3:
          return isSubmittingAddress;
        case 4:
          return isSubmittingPayment;
        default:
          return false;
      }
    }

    const renderIdentificationForm = () => (
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleInputChange}
              className={cn(
                "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                isValidEmail(formData.email) ? "border-green-500 focus:border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
              )}
            />
            {isValidEmail(formData.email) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Check className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    )

    const renderCustomerForm = () => (
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#1DA6E0] cursor-pointer" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="h-4 w-4" />
            Trocar e-mail
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500">
            <Mail className="h-4 w-4" />
            {formData.email}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome completo
          </label>
          <div className="relative">
            <Input
              id="name"
              name="name"
              placeholder="ex.: Maria de Almeida Cruz"
              value={formData.name}
              onChange={handleInputChange}
              className={cn(
                "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                isValidName(formData.name) ? "border-green-500 focus:border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
              )}
            />
            {isValidName(formData.name) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Check className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={(e) => handleMaskedInput(e, formatCPF)}
            className={cn(
              "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
              "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
            )}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Celular / WhatsApp
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => handleMaskedInput(e, formatPhone)}
            className={cn(
              "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
              "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
            )}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
      </div>
    )

    const renderAddressForm = () => (
      <div className="space-y-3">
        {!formData.savedAddress ? (
          <>
            <div>
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={(e) => handleMaskedInput(e, formatCEP)}
                onBlur={handleCepBlur}
                className={cn(
                  "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                  formData.cep.length === 8 ? "border-green-500 focus:border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
                )}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            {formData.cep.length === 8 && (
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                  Destinatário
                </label>
                <div className="relative">
                  <Input
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                      formData.recipient ? "border-green-500 focus:border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
                    )}
                  />
                  {formData.recipient && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {showAddressFields && (
              <>
                <div className="text-sm text-gray-600">
                  {formData.city} / {formData.state}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <div className="relative">
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                        formData.address ? "border-green-500 focus:border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
                      )}
                    />
                    {formData.address && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <Input
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white h-[38px]"
                    />
                    {!formData.number && (
                      <p className="text-red-500 text-xs mt-1">Campo obrigatório.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento <span className="text-gray-500">(opcional)</span>
                    </label>
                    <Input
                      id="complement"
                      name="complement"
                      value={formData.complement}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white h-[38px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={addressFieldsDisabled}
                      className={cn(
                        "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                        "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]",
                        addressFieldsDisabled && "bg-gray-100"
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleSelectChange}
                      disabled={addressFieldsDisabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1DA6E0] focus:border-[#1DA6E0] disabled:bg-gray-100"
                    >
                      <option value="">Selecione o estado</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <div className="relative">
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                        formData.neighborhood ? "border-green-500 focus:border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
                      )}
                    />
                    {formData.neighborhood && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {showSaveButton && (
              <button
                onClick={handleSaveAddress}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 mt-4"
              >
                Salvar
              </button>
            )}
          </>
        ) : (
          <>
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-[11px] font-medium">{formData.recipient}</p>
                    <p className="text-[11px]">{formData.address}, {formData.number} - {formData.neighborhood}</p>
                    <p className="text-[11px] text-gray-500">{formData.city}-{formData.state} | CEP {formData.cep}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleEditAddress} className="text-gray-400 hover:text-gray-500">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={handleDeleteAddress} className="text-gray-400 hover:text-gray-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] text-gray-700 mb-2">Escolha uma forma de entrega:</h4>
              <div className="border border-gray-200 rounded-lg">
                {product.shipping_options?.map((option: ShippingOption, index: Key | null | undefined) => (
                  <label 
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedShipping?.id === option.id
                        ? 'border-[#1DA6E0] bg-blue-50'
                        : 'border-gray-200 hover:border-[#1DA6E0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingOption"
                        value={option.id}
                        checked={selectedShipping?.id === option.id}
                        onChange={() => {
                          setSelectedShipping(option);
                          setFormData(prev => ({
                            ...prev,
                            shippingOption: option.id
                          }));
                        }}
                        className="text-[#1DA6E0] focus:ring-[#1DA6E0]"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                          <span className="font-medium text-gray-900">{option.name}</span>
                        </div>
                        <p className="text-sm text-gray-500">Receba em até {option.deadline}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-medium ${option.price === 0 ? 'text-[#22C55E]' : 'text-gray-900'}`}>
                        {option.price === 0 ? 'Grátis' : `R$ ${formatCurrency(option.price)}`}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )

    const renderPaymentForm = () => (
      <div className="space-y-3">
        <RadioGroup
          defaultValue="pix"
          onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'credit' | 'pix' | 'boleto' }))}
          className="grid grid-cols-1 gap-4"
        >
          {/* Cartão de Crédito */}
          <Label className="flex flex-col items-start">
            <Card className={cn(
              "w-full p-4 cursor-pointer relative",
              formData.paymentMethod === 'credit' ? 'border-[#1DA6E0]' : 'border-gray-200'
            )}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="credit" id="credit" className="hidden" />
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#1DA6E0]" />
                  <div>
                    <div className="text-[13px] font-medium">Cartão de crédito</div>
                    <div className="text-[10px] text-gray-500">Parcelamento em até 12x</div>
                  </div>
                </div>
              </div>
              {renderDiscountTag('credit')}
            </Card>
          </Label>

          {formData.paymentMethod === 'credit' && (
            <div className="mt-2 bg-white rounded-lg p-4 space-y-3">
              {/* Bandeiras de cartão */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2"></h3>
                <div className="flex gap-2">
                  <Image src="https://github.bubbstore.com/svg/card-amex.svg" 
                         alt="American Express" 
                         width={40} 
                         height={30} 
                  />
                  <Image src="https://github.bubbstore.com/svg/card-visa.svg" 
                         alt="Visa" 
                         width={40} 
                         height={30} 
                  />
                  <Image src="https://github.bubbstore.com/svg/card-mastercard.svg" 
                         alt="Mastercard" 
                         width={40} 
                         height={30} 
                  />
                  <Image src="https://github.bubbstore.com/svg/card-elo.svg" 
                         alt="Elo" 
                         width={40} 
                         height={30} 
                  />
                  <Image src="https://github.bubbstore.com/svg/card-hipercard.svg" 
                         alt="Hipercard" 
                         width={40} 
                         height={30} 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número do cartão
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => handleMaskedInput(e, formatCard)}
                  className={cn(
                    "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                    "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
                  )}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cardExpMonth" className="block text-sm font-medium text-gray-700 mb-1">
                    Mês <span className="text-gray-500"></span>
                  </label>
                  <select
                    id="cardExpMonth"
                    name="cardExpMonth"
                    value={formData.cardExpMonth}
                    onChange={handleSelectChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white text-sm h-[38px]"
                  >
                    <option value="">Mês</option>
                    <option value="01">01 - Jan</option>
                    <option value="02">02 - Fev</option>
                    <option value="03">03 - Mar</option>
                    <option value="04">04 - Abr</option>
                    <option value="05">05 - Mai</option>
                    <option value="06">06 - Jun</option>
                    <option value="07">07 - Jul</option>
                    <option value="08">08 - Ago</option>
                    <option value="09">09 - Set</option>
                    <option value="10">10 - Out</option>
                    <option value="11">11 - Nov</option>
                    <option value="12">12 - Dez</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cardExpYear" className="block text-sm font-medium text-gray-700 mb-1">
                    Ano
                  </label>
                  <select
                    id="cardExpYear"
                    name="cardExpYear"
                    value={formData.cardExpYear}
                    onChange={handleSelectChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white text-sm h-[38px]"
                  >
                    <option value="">Ano</option>
                    {Array.from({ length: 12 }, (_, i) => i + 2024).map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cardCvv"
                    name="cardCvv"
                    value={formData.cardCvv}
                    onChange={(e) => handleMaskedInput(e, formatCVV)}
                    className={cn(
                      "w-full border rounded-lg px-3 py-2 h-[38px] bg-white",
                      "border-gray-300 focus:border-[#1DA6E0] focus:ring-[#1DA6E0]"
                    )}
                    placeholder="000"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome como no cartão
                </label>
                <Input
                  id="cardName"
                  name="cardName"
                  placeholder="ex: Maria de Almeida Cruz"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white"
                />
              </div>

              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF do titular
                </label>
                <Input
                  id="cpf"
                  name="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white"
                />
              </div>

              <div>
                <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">
                  Nº de Parcelas
                </label>
                <select
                  id="installments"
                  name="installments"
                  value={formData.installments}
                  onChange={handleSelectChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1DA6E0] focus:ring-[#1DA6E0] bg-white text-sm"
                >
                  <option value="" className="text-gray-500">Selecione o parcelamento</option>
                  {Object.entries(installmentRates).map(([installment, rate]) => {
                    const installmentValue = calculateInstallmentValue(discountedTotal, Number(installment));
                    return (
                      <option key={installment} value={installment}>
                        {installment}x de R$ {formatCurrency(installmentValue)}
                        {rate > 0 ? ` ` : ` `}
                      </option>
                    );
                  })}
                </select>
                <p className="text-sm text-gray-500 mt-1"></p>
              </div>

              <div className="mt-4 space-y-2">
                {offers.filter(offer => offer.type === 'orderbump').map(offer => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-purple-600 text-sm font-medium mb-1">
                          Separamos essa oferta para você!!
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm line-through">
                            R$ {formatCurrency(offer.product.originalPrice)}
                          </span>
                          <span className="text-[#22C55E] font-medium">
                            R$ {formatCurrency(offer.product.discountedPrice)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedOffers[offer.id] || false}
                              onChange={() => handleOfferSelection(offer.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {offers.filter(offer => offer.type === 'upsell').map(offer => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-purple-600 text-sm font-medium mb-1">
                          Separamos essa oferta para você!!
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm line-through">
                            R$ {formatCurrency(offer.product.originalPrice)}
                          </span>
                          <span className="text-[#22C55E] font-medium">
                            R$ {formatCurrency(offer.product.discountedPrice)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedOffers[offer.id] || false}
                              onChange={() => handleOfferSelection(offer.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePaymentSubmit}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Comprar agora
              </button>
            </div>
          )}

          <Label className="flex flex-col items-start">
            <Card className={cn(
              "w-full p-4 cursor-pointer relative",
              formData.paymentMethod === 'pix' ? 'border-[#1DA6E0]' : 'border-gray-200'
            )}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="pix" id="pix" className="hidden" />
                <div className="flex items-center gap-2">
                  <Image
                    src="/pixStep4.png"
                    alt="PIX"
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                  <div>
                    <div className="text-[13px] font-medium">PIX</div>
                    <div className="text-[10px] text-gray-500">Aprovação imediata</div>
                  </div>
                </div>
              </div>
              {renderDiscountTag('pix')}
            </Card>
          </Label>

          {formData.paymentMethod === 'pix' && (
            <div className="mt-2 bg-white rounded-lg p-4 space-y-3">
              <div className="text-gray-600">
                <p>A confirmação de pagamento é realizada em poucos minutos.</p>
                <p>Utilize o aplicativo do seu banco para pagar.</p>
              </div>

              <div className="py-2">
                <p className="text-[#1DA6E0] font-medium">
                  Valor no Pix: R$ {formatCurrency(discountedTotal)}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {offers.filter(offer => offer.type === 'orderbump').map(offer => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-purple-600 text-sm font-medium mb-1">
                          Separamos essa oferta para você!!
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm line-through">
                            R$ {formatCurrency(offer.product.originalPrice)}
                          </span>
                          <span className="text-[#22C55E] font-medium">
                            R$ {formatCurrency(offer.product.discountedPrice)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedOffers[offer.id] || false}
                              onChange={() => handleOfferSelection(offer.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {offers.filter(offer => offer.type === 'upsell').map(offer => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-purple-600 text-sm font-medium mb-1">
                          Separamos essa oferta para você!!
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm line-through">
                            R$ {formatCurrency(offer.product.originalPrice)}
                          </span>
                          <span className="text-[#22C55E] font-medium">
                            R$ {formatCurrency(offer.product.discountedPrice)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedOffers[offer.id] || false}
                              onChange={() => handleOfferSelection(offer.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePaymentSubmit}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Comprar agora
              </button>
            </div>
          )}

          <Label className="flex flex-col items-start">
            <Card className={cn(
              "w-full p-4 cursor-pointer relative",
              formData.paymentMethod === 'boleto' ? 'border-[#1DA6E0]' : 'border-gray-200'
            )}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="boleto" id="boleto" className="hidden" />
                <div className="flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-[#1DA6E0]" />
                  <div>
                    <div className="text-[13px] font-medium">Boleto bancário</div>
                    <div className="text-[10px] text-gray-500">Vencimento em 3 dias úteis</div>
                  </div>
                </div>
              </div>
              {renderDiscountTag('boleto')}
            </Card>
          </Label>

          {formData.paymentMethod === 'boleto' && (
            <div className="mt-2 bg-white rounded-lg p-4 space-y-3">
              <div className="text-gray-600">
                <p>O boleto tem vencimento em 3 dias úteis.</p>
                <p>O pedido será confirmado após o pagamento.</p>
              </div>

              <div className="py-2">
                <p className="text-[#1DA6E0] font-medium">
                  Valor no Boleto: R$ {formatCurrency(discountedTotal)}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {offers.filter(offer => offer.type === 'orderbump').map(offer => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-purple-600 text-sm font-medium mb-1">
                          Separamos essa oferta para você!!
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">
                            R$ {formatCurrency(offer.product.originalPrice)}
                          </span>
                          <span className="text-[#22C55E] font-medium">
                            R$ {formatCurrency(offer.product.discountedPrice)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedOffers[offer.id] || false}
                              onChange={() => handleOfferSelection(offer.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {offers.filter(offer => offer.type === 'upsell').map(offer => (
                  <div key={offer.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16">
                        <Image
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-purple-600 text-sm font-medium mb-1">
                          Separamos essa oferta para você!!
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">
                            R$ {formatCurrency(offer.product.originalPrice)}
                          </span>
                          <span className="text-[#22C55E] font-medium">
                            R$ {formatCurrency(offer.product.discountedPrice)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedOffers[offer.id] || false}
                              onChange={() => handleOfferSelection(offer.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePaymentSubmit}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Comprar agora
              </button>
            </div>
          )}
        </RadioGroup>

      </div>
    )

    // Interfaces para OrderBump e Upsell
    interface OfferProduct {
      id: string;
      name: string;
      description: string;
      originalPrice: number;
      discountedPrice: number;
      imageUrl: string;
    }

    interface Offer {
      id: string;
      type: 'orderbump' | 'upsell';
      product: OfferProduct;
      active: boolean;
    }

    // Estado para armazenar as ofertas
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOffers, setSelectedOffers] = useState<{ [key: string]: boolean }>({});
    const [totalWithOffers, setTotalWithOffers] = useState(0);

    // Carregar as ofertas reais
    useEffect(() => {
      const loadOffers = async () => {
        const productOffers = await getOffers(product.product_id);
        setOffers(productOffers);
      };
      loadOffers();
    }, [product.product_id]);

    // Calcula o total com as ofertas selecionadas
    useEffect(() => {
      const newTotal = offers.reduce((acc, offer) => {
        if (selectedOffers[offer.id]) {
          return acc + offer.product.discountedPrice;
        }
        return acc;
      }, product.price);
      setTotalWithOffers(newTotal);
    }, [selectedOffers, offers, product.price]);

    // Função para lidar com a seleção de ofertas
    const handleOfferSelection = (offerId: string) => {
      setSelectedOffers(prev => ({
        ...prev,
        [offerId]: !prev[offerId]
      }));
    };

    // Função auxiliar para renderizar uma oferta
    const renderOffer = (offer: Offer) => {
      if (!offer.active) return null;

      const discount = ((offer.product.originalPrice - offer.product.discountedPrice) / offer.product.originalPrice) * 100;

      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={offer.product.imageUrl}
                alt={offer.product.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#6B46C1] text-sm font-medium mb-1">
                Separamos essa oferta para você!!
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">{offer.product.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm line-through">
                  R$ {formatCurrency(offer.product.originalPrice)}
                </span>
                <span className="text-[#FF5722] font-medium text-sm">
                  R$ {formatCurrency(offer.product.discountedPrice)}
                </span>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={selectedOffers[offer.id] || false}
                    onChange={(e) => {
                      handleOfferSelection(offer.id);
                    }}
                    />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6B46C1]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const getPaymentDiscount = useCallback((total: number, method: string) => {
      const discountPercentage = 0.05; // 5% de desconto
      return method ? total * discountPercentage : 0;
    }, []);

    const calculateTotalWithOffersAndPayment = useCallback((baseTotal: number) => {
      const offersTotal = offers.reduce((acc, offer) => {
        if (selectedOffers[offer.id]) {
          return acc + offer.product.discountedPrice;
        }
        return acc;
      }, 0);

      const totalWithOffers = baseTotal + offersTotal;
      const paymentDiscount = getPaymentDiscount(totalWithOffers, formData.paymentMethod);
      
      return totalWithOffers - paymentDiscount;
    }, [offers, selectedOffers, formData.paymentMethod, getPaymentDiscount]);

    const handlePaymentMethodChange = (method: 'credit' | 'pix' | 'boleto') => {
      setFormData(prev => ({
        ...prev,
        paymentMethod: method
      }));
    };

    const getPaymentMethodTotal = useCallback((total: number, method: string) => {
      let discountPercentage = 0;
      
      switch (method) {
        case 'credit':
          discountPercentage = product.card_discount || 0;
          break;
        case 'pix':
          discountPercentage = product.pix_discount || 0;
          break;
        case 'boleto':
          discountPercentage = product.boleto_discount || 0;
          break;
      }

      return total * (1 - discountPercentage / 100);
    }, []);

    const renderPaymentMethodValue = (method: string) => {
      let discountPercentage = 0;
      
      switch (method) {
        case 'credit':
          discountPercentage = product.card_discount || 0;
          break;
        case 'pix':
          discountPercentage = product.pix_discount || 0;
          break;
        case 'boleto':
          discountPercentage = product.boleto_discount || 0;
          break;
      }

      if (discountPercentage <= 0) {
        return (
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900">
              R$ {formatCurrency(baseTotal)}
            </span>
          </div>
        );
      }

      const methodTotal = getPaymentMethodTotal(baseTotal, method);
      const discount = baseTotal * (discountPercentage / 100);
      
      return (
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-sm text-gray-500 line-through block">
              R$ {formatCurrency(baseTotal)}
            </span>
            <span className="text-sm font-medium text-green-600">
              R$ {formatCurrency(methodTotal)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs bg-green-600 text-green-50 px-1.5 py-0.5 rounded">
              -{discountPercentage}% OFF
            </span>
            <span className="text-xs text-green-600">
              Economia de R$ {formatCurrency(discount)}
            </span>
          </div>
        </div>
      );
    };

    // Efeito para selecionar o primeiro frete quando as opções estiverem disponíveis
    useEffect(() => {
      if (product?.shipping_options?.length > 0 && !selectedShipping) {
        const firstOption = product.shipping_options[0];
        setSelectedShipping(firstOption);
        setFormData(prev => ({
          ...prev,
          shippingOption: firstOption.id
        }));
        
        // Atualiza o UserUpdateManager com a primeira opção de frete
        UserUpdateManager.updateShippingOption(firstOption);
      }
    }, [product?.shipping_options, selectedShipping]);

    // Funções de formatação
    const formatCPF = (value: string) => {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
          .replace(/(-\d{2})\d+?$/, '$1');
      }
      return value.slice(0, 14);
    };

    const formatPhone = (value: string) => {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 11) {
        if (numbers.length === 11) {
          return numbers.replace(/(\d{2})(\d{5})(\d{4})/g, '($1) $2-$3');
        } else if (numbers.length === 10) {
          return numbers.replace(/(\d{2})(\d{4})(\d{4})/g, '($1) $2-$3');
        }
        return numbers;
      }
      return value.slice(0, 15);
    };

    const formatCEP = (value: string) => {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 8) {
        return numbers.replace(/(\d{5})(\d{3})/g, '$1-$2');
      }
      return value.slice(0, 9);
    };

    const formatCard = (value: string) => {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 16) {
        // Para cartões de 16 dígitos (Visa, Mastercard, etc)
        if (numbers.length === 16) {
          return numbers.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/g, '$1 $2 $3 $4');
        }
        // Para cartões de 15 dígitos (Amex)
        else if (numbers.length === 15) {
          return numbers.replace(/(\d{4})(\d{6})(\d{5})/g, '$1 $2 $3');
        }
        return numbers.replace(/(\d{4})/g, '$1 ').trim();
      }
      return value.slice(0, 19); // 16 dígitos + 3 espaços
    };

    const formatCVV = (value: string) => {
      const numbers = value.replace(/\D/g, '');
      // Permite 3 ou 4 dígitos
      if (numbers.length <= 4) {
        return numbers;
      }
      return value.slice(0, 4);
    };

    // Handler para inputs com máscara
    const handleMaskedInput = (e: React.ChangeEvent<HTMLInputElement>, formatter: (value: string) => string) => {
      const { name, value } = e.target;
      const formattedValue = formatter(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    // Função para formatar valores monetários com arredondamento
    const formatCurrency = (value: number) => {
      // Arredonda para 2 casas decimais usando Math.ceil
      const rounded = Math.ceil(value * 100) / 100;
      return rounded.toFixed(2).replace('.', ',');
    };

    // Função para calcular o valor do desconto
    const calculateSavings = (total: number, percentage: number) => {
      const savings = total * (percentage / 100);
      return savings;
    };

    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
      // Buscar order_id existente ou criar novo
      const fetchOrCreateOrder = async () => {
        const userData = await UserCreationManager.getUserData();
        if (userData?.order_id) {
          setOrderId(userData.order_id);
        }
      };
      
      fetchOrCreateOrder();
    }, []); // Executa apenas uma vez quando o componente monta

    useEffect(() => {
      if (orderTotal > 0) {
        trackInitiateCheckout({
          content_ids: [product.id],
          content_name: product.name,
          content_type: 'product',
          value: orderTotal,
          currency: 'BRL',
          order_id: orderId
        });
      }
    }, [orderTotal, product.id, product.name, orderId]);

    useEffect(() => {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, []);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DA6E0] mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900">Carregando...</h2>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-checkout-bg">
        <Header />
        <div className="flex-1 bg-checkout-bg pt-[60px]">
          <div className="container mx-auto px-4 py-8">
            {/* Resumo do Produto */}
            <div className="mb-8">
              <OrderSummary 
                product={product}
                quantity={quantity} 
                setQuantity={setQuantity} 
                selectedOffers={selectedOffers}
                offers={offers}
                paymentMethod={formData.paymentMethod}
                onTotalChange={(total) => {
                  setOrderTotal(total);
                  const finalTotal = getPaymentMethodTotal(total, formData.paymentMethod);
                  setDiscountedTotal(finalTotal);
                }}
                onDiscountedTotalChange={(total) => {
                  setDiscountedTotal(total);
                }}
                shippingCost={selectedShipping?.price || 0}
              />
            </div>

            {/* Formulário */}
            <div className="space-y-8">
              {/* Formulário de Etapa */}
              <Card className="w-full bg-white">
                <CardContent className="p-6">
                  <div className="flex-1 max-w-full mx-auto w-full px-0 py-2">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm">
                          {getStepTitle().number}
                        </div>
                        <h2 className="text-[17px] font-semibold">{getStepTitle().title}</h2>
                      </div>
                      <p className="text-[13px] text-gray-600">{getStepTitle().description}</p>
                    </div>
                  </div>
                  {currentStep === 1 && renderIdentificationForm()}
                  {currentStep === 2 && renderCustomerForm()}
                  {currentStep === 3 && renderAddressForm()}
                  {currentStep === 4 && renderPaymentForm()}
                  
                  {currentStep !== 4 && (
                    <Button 
                      onClick={handleContinue} 
                      disabled={
                        isLoadingUrls || 
                        isSubmittingEmail || 
                        isSubmittingCustomer || 
                        isSubmittingAddress || 
                        isSubmittingPayment ||
                        showSaveButton
                      }
                      className={cn(
                        "w-full mt-4 py-3 px-4 rounded-lg flex items-center justify-center gap-2",
                        isLoadingUrls || isSubmittingEmail || isSubmittingCustomer || isSubmittingAddress || isSubmittingPayment || showSaveButton
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-[#22C55E] hover:bg-[#16A34A] text-white"
                      )}
                    >
                      {isLoadingUrls ? 'Carregando...' : 'Continuar'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Componente de página de checkout
  export default function CheckoutPage({
    params: { productId }
  }: {
    params: { productId: string }
  }) {
    return (
      <>
        <CustomCSS />
        <ProductFetcher productId={productId} />
      </>
    );
  }
