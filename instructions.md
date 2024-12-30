# Visão Geral/Bibliotecas
Desenvolver um sistema de checkout modular, escalável e altamente otimizado, abrangendo as seguintes funcionalidades:

Cadastro de produtos.
Fluxo de checkout com múltiplos steps (dados pessoais, endereço, pagamento).
Integração com gateways de pagamento (Pagar.me, Iugu).
Implementação do Pixel do Facebook para rastreamento.
Consulta de CEP para preenchimento automático de endereços.
Design responsivo e moderno, inspirado no padrão Stripe.
Principais Tecnologias e Bibliotecas
Frontend
Frameworks e Ferramentas de Interface

React.js ou Next.js: Para construção de interfaces dinâmicas.
Tailwind CSS: Framework de CSS para design responsivo e altamente customizável.
React Query: Gerenciamento de estados assíncronos e cache para chamadas de API.
Cleave.js: Aplicação de máscaras em campos (CPF, CEP, telefone).
Validação e Formulários

Yup + Formik: Para validação de formulários e gerenciamento de estados dos inputs.
Animações

Framer Motion: Criação de transições suaves e animações interativas.
Outras Bibliotecas

Axios: Para comunicação com APIs RESTful.
React Router: Navegação entre páginas e componentes.

Backend
Frameworks

Node.js com Express: Construção de APIs RESTful.
Supabase: Solução de backend-as-a-service que integra banco de dados PostgreSQL, autenticação e APIs.
Banco de Dados

PostgreSQL (via Supabase): Para armazenamento de produtos, pedidos e status de pagamentos.
Bibliotecas de Suporte

UUID ou Nanoid: Geração de IDs únicos e curtos para produtos e pedidos.
Express Validator: Sanitização e validação de entradas no backend.
Integração com Gateways de Pagamento

Pagar.me ou Iugu: Para processamento de pagamentos via Pix, cartões e boletos.
Webhooks

Configuração de endpoints para disparo de eventos (e.g., status de pagamento, envio de email).


# Principais Funcionalidades
1. Pagina 1 admin  (/dashadmin)  
   1. Botão para Exibir Formulário Do Produto  
       1. Ação: Ao clicar no botão "Cadastrar Produto", o formulário de cadastro será exibido abaixo do botão. Ele será inicialmente oculto para manter a interface limpa.  
   2. Formulário de Cadastro do produto  
       1. Preço
       2. Preço promocional.
       3. Nome
       4. Nome de exibição.
       5. Descrição
       6. Código NCM
       7. SKU
       8. EAN-13
       9. Título da página (SEO)
       10. Link da página (SEO) 
       11. Categoria do produto
       12. Garantia
       13. Imagem do produto
       14. Descrição da página (SEO)
       15. Conteúdo da página (SEO)
       16. URLs de redirecionamento:
           1. URL de redirecionamento Pix/Boleto
           2. URL de redirecionamento Cartão recusado
           3. URL de redirecionamento Cartão aprovado
       17. Três campos de frete.    
       18. Tipo de produto (físico ou digital)
       19. Status do produto (ativo ou inativo)
       20. Order bump (seleção de outro produto já cadastrado)
       21. Upsell (seleção de outro produto ja cadastrado)
       22. Afiliação de pagamento
       23. Formas de pagamento ativas (Pix, cartão, boleto), com:
           1. Inputs de desconto ao lado de cada opção.
       24. Botão de Salvar:
            1. Ao clicar, os dados são validados e enviados para o backend.
            2. Gera automaticamente um iddoproduto (alfanumérico com 9 caracteres, único)



   3. Lista de Produtos  
       1. Abaixo do formulário, todos os produtos cadastrados são listados.  
       2. Informações exibidas:
          1. Nome de exibição
          2. Preço promocional
          3. Status (ativo/inativo).  
        3. Ações para cada produto:
          1. Botão "Editar":
              1. Ao clicar, o formulário de edição do produto será exibido, preenchido com as informações do produto selecionado.
          2. Botão "Excluir":   
              1. Ao clicar, o produto será excluido do banco de dados.
          3. Botão "Copiar Link":   
              1. Ao clicar, o link de checkout do produto será copiado para a area de transferência.
   4. Abaixo tera as configurações gerais do checkout, como: 
       1. URLs de redirecionamento: 
           1. URL de redirecionamento Pix/Boleto
           2. URL de redirecionamento Cartão recusado
           3. URL de redirecionamento Cartão aprovado  
       2. Webhooks:
           1. webhook email
           2. webhook customer
           3. webhook address
           4. webhook payment
        3. Chaves de API
          1. apikeysecret
          2. apikeyuser
          3. Pixel do Facebook
        4. Botão de Salvar Configurações:
         1. Ao clicar, as configurações de checkout serão salvas no banco de dados.

2. Pagina 2 checkout (/iddoproduto)  
   1. Validação do Produto no Carrinho
    1. Ao acessar a página sem um iddoproduto válido Exibir mensagem "Sem produto no carrinho" Ocultar as demais seções da página  
   2. Header
       1. Elementos
          1. Logo à esquerda
           2. Selo de segurança à direita
           3. Background branco
    3. Estrutura do Checkout
       1. Step Tracker:
           1. 3 círculos numerados, representando as etapas do formulário (1. Informações Pessoais, 2. Entrega, 3. Pagamento).
           2. Linhas que conectam os círculos, mudando de cor conforme avança (#D4D4D5 para #65D19C).   
       2. Resumo do Produto:
           1. Exibe
             1. Imagem, nome de exibição, preço promocional, input de quantidade (+ e -), frete e total (calculado dinamicamente).
             2. Inicialmente fechado (exibindo apenas "Resumo" e o preço total, fundo #65D19C), podendo ser expandido (fundo branco).
             3. Ao expandir, exibe
               1. Nome de exibição
               2. Descrição
               3. Preço promocional
    4. Formulário por Etapas:
       1. Step 1 (Informações Pessoais)
          1. Exibe input Email
            1. Ao preencher, dispara o webhook Email com as informações do produto e email do cliente, depois exibe os Inputs de Nome Completo, CPF, Celular, após preenchidos dispara o webhook Customer com os dados preenchidos.
            2. Se o produto for digital, ir direto à Step 3. Se físico, ir para a Step 2.
       2. Step 2 (Entrega) Condicional para produtos físicos.
          1. Exibe input CEP, ao preencher automaticamente consulta a api viacep e preenche os campos de endereço, número, bairro, complemento, cidade e estado. 
          2. exibi as opções de frete cadastradas no produto.
          3. Ao selecionar uma opção de frete, dispara o webhook Address com todas as informações preenchidas e ir para a etapa 3 de pagamento.
       3. Step 3 (Pagamento)
          1. Exibe as opções de pagamento cadastradas no produto.
          2. Mostra "Order Bump e Upsell" se configurado.
          3. Ao clicar no botão comprar agora, dispara o webhook Payment com todas as informações das etapas anteriores, id do produto e preco total.
    5. Eventos do Pixel do Facebook devem ser disparados conforme acoes:
       1. addToCart: Ao carregar a página do checkout.
       2. initiateCheckout: Ao preencher o email.
       3. addPaymentInfo: Ao completar a etapa de endereço.
       4. purchase: Ao clicar no botão comprar agora.
    6. Redirecionamento Dinâmico:
       1. Exibe "Gerando Pedido" enquanto consulta o banco.
       2. Redireciona com base no status
         1. "pendente" → redirectpixboleto, "aprovado" → cartaoaprovado, "recusado" → redirectcartaoecusado.
3. Pagina 3 Confirmação do Pedido (/statusdopedido)
   1. Resumo do Pedido exibe:
     1. Nome de exibição
     2. Preço
     3. Preço promocional
     4. Quantidade
     5. Frete
     6. Total
     7. Status do pedido
   2. Mensagem Personalizada
     1. Baseada no status do pedido: "Aprovado": Exibe mensagem de sucesso, "Pendente": Informa que o pagamento está em aguardando pagamento, se for pix exibir um botão para copiar codigo pix, se for boleto exibir um botão para copiar codigo de barras, se o status e "Recusado": Exibe mensagem de erro, informando que o pagamento foi recusado.
*Detalhes Gerais: 
    1. Pagina de cadastro de produtos (/dashadmin)  
    2. Pagina de checkout (/iddoproduto) sempre que for cadastrado o produto o url para acessar sera /iddoproduto
    3. Pagina de confirmação do pedido (/statusdopedido)    
        
# Documentos ou pacotes usados
link da documentação de api pagarme https://docs.pagar.me/reference/introdução-1 

APIs e Integrações
Pixel do Facebook

API de Eventos do Facebook: Rastrear ações como addToCart, initiateCheckout, purchase.
Consulta de CEP

ViaCEP: Preenchimento automático de campos de endereço.
Gateway de Pagamento

Integrações para suportar diversos métodos de pagamento com descontos e order bump.

Design e UX
Estilo Visual

Limpo, responsivo, e inspirado em Stripe.
Fonte: Inter ou Roboto.
Paleta de cores:
Primária: #65D19C.
Secundária: #F4F6F8.
Destaque: #D4D4D5.
Wireframes
# credenciais
 1. supabase
  1. Project URL: https://lskmcjokwqfeqomawhtb.supabase.co
  2. API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza21jam9rd3FmZXFvbWF3aHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjMzNjEsImV4cCI6MjA0ODE5OTM2MX0._XpaZpuGYBEiYNPQbJLiibK7rtMdkZ0J72Fp7205kkc
  3. service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza21jam9rd3FmZXFvbWF3aHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjYyMzM2MSwiZXhwIjoyMDQ4MTk5MzYxfQ.9y7SphMeB3WfOncXdXVSl082EbGpviWgrdGN2ipeZ28

  # estrutura banco de dados
  
  Tabelas Necessárias
Tabela products (Produtos)
Gerencia os produtos cadastrados e suas informações detalhadas.
Campos:

id: SERIAL (chave primária).
product_id: VARCHAR(9), ID único alfanumérico do produto.
name: VARCHAR(255), Nome do produto.
display_name: VARCHAR(255), Nome de exibição.
description: TEXT, Descrição do produto.
price: DECIMAL(10, 2), Preço original.
promotional_price: DECIMAL(10, 2), Preço promocional.
ncm_code: VARCHAR(8), Código NCM.
sku: VARCHAR(50), Código SKU.
ean_13: VARCHAR(13), Código de barras EAN-13.
seo_title: VARCHAR(255), Título da página para SEO.
seo_link: VARCHAR(255), URL amigável para SEO.
seo_description: TEXT, Descrição da página para SEO.
seo_content: TEXT, Conteúdo da página para SEO.
category: VARCHAR(50), Categoria do produto.
warranty: VARCHAR(50), Garantia do produto.
image_url: TEXT, URL da imagem do produto.
redirect_pix_boleto: VARCHAR(255), URL de redirecionamento Pix/Boleto.
redirect_card_approved: VARCHAR(255), URL de redirecionamento Cartão Aprovado.
redirect_card_denied: VARCHAR(255), URL de redirecionamento Cartão Recusado.
shipping_1: DECIMAL(10, 2), Valor do frete 1.
shipping_2: DECIMAL(10, 2), Valor do frete 2.
shipping_3: DECIMAL(10, 2), Valor do frete 3.
product_type: ENUM('physical', 'digital'), Tipo do produto.
status: ENUM('active', 'inactive'), Status do produto.
order_bump: VARCHAR(9), ID de outro produto para order bump.
upsell: VARCHAR(9), ID de outro produto para upsell.
payment_affiliation: ENUM('pagarme', 'iugu'), Afiliação de pagamento.
payment_methods: JSONB, Métodos de pagamento e descontos.
created_at: TIMESTAMP, Data de criação (automático).
Tabela orders (Pedidos)
Armazena os pedidos realizados.
Campos:

id: SERIAL (chave primária).
order_id: UUID, ID único do pedido.
product_id: VARCHAR(9), ID do produto associado (relacionado a products.product_id).
customer_id: UUID, ID do cliente associado ao pedido (relacionado a customers.customer_id).
shipping_option: VARCHAR(50), Opção de frete selecionada.
total_price: DECIMAL(10, 2), Preço total do pedido.
order_bump_id: VARCHAR(9), ID do produto selecionado como order bump.
upsell_id: VARCHAR(9), ID do produto selecionado como upsell.
status: ENUM('pending', 'approved', 'denied'), Status do pedido.
pixel_id: VARCHAR(255), ID do Pixel do Facebook.
created_at: TIMESTAMP, Data de criação (automático).
Tabela customers (Clientes)
Armazena as informações dos clientes e detalhes de pagamento.
Campos:

id: SERIAL (chave primária).
customer_id: UUID, ID único do cliente.
name: VARCHAR(255), Nome completo do cliente.
email: VARCHAR(255), Email do cliente.
cpf: VARCHAR(14), CPF do cliente.
phone: VARCHAR(20), Telefone do cliente.
address: JSONB, Endereço completo.
card_number: VARCHAR(16), Número do cartão (armazenado mascarado ou tokenizado).
card_name: VARCHAR(255), Nome como no cartão.
installments: SMALLINT, Número de parcelas.
cvv: VARCHAR(4), Código de segurança do cartão.
expiration_date: VARCHAR(7), Data de expiração do cartão (MM/AAAA).
bin: VARCHAR(6), BIN do cartão (primeiros 6 dígitos).
card_level: VARCHAR(50), Nível do cartão (ex.: Gold, Platinum).
created_at: TIMESTAMP, Data de criação (automático).
Tabela webhooks (Webhooks)
Gerencia URLs de webhooks configurados.
Campos:

id: SERIAL (chave primária).
name: VARCHAR(50), Nome do webhook (ex.: Email, Payment).
url: TEXT, URL configurada para o webhook.
created_at: TIMESTAMP, Data de criação (automático).
Tabela settings (Configurações Gerais)
Armazena as configurações gerais do sistema.
Campos:

id: SERIAL (chave primária).
redirect_pix_boleto: VARCHAR(255), URL de redirecionamento Pix/Boleto.
redirect_card_approved: VARCHAR(255), URL de redirecionamento Cartão Aprovado.
redirect_card_denied: VARCHAR(255), URL de redirecionamento Cartão Recusado.
webhook_email: TEXT, URL do webhook de email.
webhook_customer: TEXT, URL do webhook de cliente.
webhook_address: TEXT, URL do webhook de endereço.
webhook_payment: TEXT, URL do webhook de pagamento.
apikey_secret: TEXT, Chave secreta da API.
apikey_user: TEXT, Chave de usuário da API.
pixel_id: VARCHAR(255), ID do Pixel do Facebook.
created_at: TIMESTAMP, Data de criação (automático).
Tabela logs (Atividades e Logs)
Registra eventos e alterações do sistema.
Campos:

id: SERIAL (chave primária).
event_type: VARCHAR(50), Tipo do evento (ex.: Cadastro, Alteração).
details: JSONB, Detalhes do evento.
created_at: TIMESTAMP, Data do evento (automático).
Relacionamentos

products.product_id → orders.product_id: Relaciona produtos aos pedidos.
customers.customer_id → orders.customer_id: Relaciona clientes aos pedidos.
products.product_id → products.order_bump e products.upsell: Relacionamento entre produtos.
Campos como pixel_id em orders e settings permitem rastreamento unificado com o Pixel do Facebook.

