import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FormikErrors, FormikTouched } from 'formik';
import * as Yup from 'yup';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/services/upload';
import Image from 'next/image';

interface ShippingOption {
  name: string;
  price: number;
  deadline: string;
}

interface FormValues {
  name: string;
  display_name: string;
  description: string;
  price: number;
  promotional_price?: number | null;
  product_type: 'digital' | 'physical';
  status: 'active' | 'inactive' | 'draft';
  page_title?: string;
  page_link?: string;
  page_description?: string;
  page_content?: string;
  pix_boleto_redirect_url?: string;
  card_rejected_redirect_url?: string;
  card_approved_redirect_url?: string;
  shipping_options?: ShippingOption[];
  upsell_product?: string;
  upsell_discount?: number;
  order_bump_product?: string;
  order_bump_discount?: number;
}

interface ProductFormProps {
  onSuccess: () => void;
  initialValues?: FormValues;
}

interface Product {
  product_id: string;
  name: string;
  price: number;
  image_url?: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome do produto é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  display_name: Yup.string()
    .required('Nome de exibição é obrigatório')
    .min(3, 'Nome de exibição deve ter pelo menos 3 caracteres')
    .max(100, 'Nome de exibição não pode exceder 100 caracteres'),
  description: Yup.string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição não pode exceder 1000 caracteres'),
  price: Yup.number()
    .required('Preço é obrigatório')
    .positive('Preço deve ser positivo')
    .typeError('Preço inválido'),
  promotional_price: Yup.number()
    .nullable()
    .positive('Preço promocional deve ser positivo')
    .max(Yup.ref('price'), 'Preço promocional não pode ser maior que o preço original')
    .typeError('Preço promocional inválido'),
  product_type: Yup.string()
    .required('Tipo de produto é obrigatório')
    .oneOf(['digital', 'physical'], 'Tipo de produto inválido'),
  status: Yup.string()
    .required('Status é obrigatório')
    .oneOf(['active', 'inactive', 'draft'], 'Status inválido'),
  
  // Novos campos SEO
  page_title: Yup.string()
    .max(70, 'Título da página não pode exceder 70 caracteres'),
  page_link: Yup.string()
    .matches(/^[a-z0-9-]+$/, 'Link da página deve conter apenas letras minúsculas, números e hífens'),
  page_description: Yup.string()
    .max(160, 'Descrição da página não pode exceder 160 caracteres'),
  page_content: Yup.string(),

  // URLs de Redirecionamento
  pix_boleto_redirect_url: Yup.string().url('URL de Pix/Boleto inválida'),
  card_rejected_redirect_url: Yup.string().url('URL de Cartão Recusado inválida'),
  card_approved_redirect_url: Yup.string().url('URL de Cartão Aprovado inválida'),

  // Opções de Frete
  shipping_options: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Nome do frete é obrigatório'),
      deadline: Yup.string().required('Prazo de entrega é obrigatório'),
      price: Yup.number()
        .required('Preço do frete é obrigatório')
        .min(0, 'Preço do frete não pode ser negativo')
        .typeError('Preço do frete inválido'),
    })
  ),
  order_bump_product: Yup.string(),
  order_bump_discount: Yup.number()
    .transform((value) => (isNaN(value) || value === null ? 0 : value))
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode ser maior que 100%')
    .when('order_bump_product', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required('Desconto é obrigatório quando um produto é selecionado')
    }),
  upsell_product: Yup.string(),
  upsell_discount: Yup.number()
    .transform((value) => (isNaN(value) || value === null ? 0 : value))
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode ser maior que 100%')
    .when('upsell_product', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required('Desconto é obrigatório quando um produto é selecionado')
    }),
});

const defaultValues: FormValues = {
  name: '',
  display_name: '',
  description: '',
  price: 0,
  promotional_price: null,
  product_type: 'physical',
  status: 'active',
  page_title: '',
  page_link: '',
  page_description: '',
  page_content: '',
  pix_boleto_redirect_url: '',
  card_rejected_redirect_url: '',
  card_approved_redirect_url: '',
  shipping_options: [],
  order_bump_product: '',
  order_bump_discount: 0,
  upsell_product: '',
  upsell_discount: 0,
};

export default function ProductForm({ onSuccess, initialValues }: ProductFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.image_url || null);
  const [products, setProducts] = useState<Product[]>([]);

  // Carregar lista de produtos
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, name, price, image_url')
        .eq('status', 'active');
      
      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }

      setProducts(data || []);
    };

    fetchProducts();
  }, []);

  const handleCopyCheckoutLink = (checkoutId: string) => {
    const url = `${window.location.origin}/checkout/${checkoutId}`;
    navigator.clipboard.writeText(url)
      .then(() => alert('Link do checkout copiado!'))
      .catch(() => alert('Erro ao copiar link'));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Garantir que nenhum valor seja null
  const sanitizedInitialValues = initialValues ? {
    ...initialValues,
    promotional_price: initialValues.promotional_price || '',
    product_type: initialValues.product_type || 'physical',
    status: initialValues.status || 'active',
    page_title: initialValues.page_title || '',
    page_link: initialValues.page_link || '',
    page_description: initialValues.page_description || '',
    page_content: initialValues.page_content || '',
    pix_boleto_redirect_url: initialValues.pix_boleto_redirect_url || '',
    card_rejected_redirect_url: initialValues.card_rejected_redirect_url || '',
    card_approved_redirect_url: initialValues.card_approved_redirect_url || '',
    shipping_options: initialValues.shipping_options || [],
    order_bump_product: initialValues.order_bump_product || '',
    order_bump_discount: initialValues.order_bump_discount || 0,
    upsell_product: initialValues.upsell_product || '',
    upsell_discount: initialValues.upsell_discount || 0,
  } : defaultValues;

  const handleSubmit = async (values: FormValues, { setSubmitting, resetForm }: any) => {
    try {
      console.log('Iniciando submissão do formulário...');
      console.log('Valores do formulário:', values);

      const productData = {
        name: values.name,
        display_name: values.display_name,
        description: values.description,
        price: values.price,
        promotional_price: values.promotional_price || null,
        product_type: values.product_type,
        status: values.status,
        page_title: values.page_title || null,
        page_link: values.page_link || null,
        page_description: values.page_description || null,
        page_content: values.page_content || null,
        pix_boleto_redirect_url: values.pix_boleto_redirect_url || null,
        card_rejected_redirect_url: values.card_rejected_redirect_url || null,
        card_approved_redirect_url: values.card_approved_redirect_url || null,
        shipping_options: values.shipping_options.map((option: any) => ({
          ...option,
          price: Number(option.price),
        })),
        order_bump_product: values.order_bump_product || null,
        order_bump_discount: values.order_bump_discount || 0,
        upsell_product: values.upsell_product || null,
        upsell_discount: values.upsell_discount || 0,
        updated_at: new Date().toISOString(),
      };

      let result;
      let productId;

      if (initialValues?.product_id) {
        console.log('Atualizando produto:', initialValues.product_id);
        result = await supabase
          .from('products')
          .update(productData)
          .eq('product_id', initialValues.product_id)
          .select();
        
        productId = initialValues.product_id;
      } else {
        console.log('Criando novo produto...');
        productId = nanoid();
        
        result = await supabase
          .from('products')
          .insert({
            ...productData,
            product_id: productId,
            created_at: new Date().toISOString()
          })
          .select();
      }

      if (result.error) {
        console.error('Erro ao salvar produto:', result.error);
        throw result.error;
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('Nenhum dado retornado após salvar o produto');
      }

      // Upload de imagem
      let imageUrl = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadProductImage(selectedImage, productId);
          console.log('Imagem enviada com sucesso:', imageUrl);
        } catch (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          // Notificar usuário sobre falha no upload
          alert(`Erro ao fazer upload da imagem: ${uploadError instanceof Error ? uploadError.message : 'Erro desconhecido'}`);
        }
      }

      // Mensagem de sucesso
      alert(initialValues?.product_id 
        ? 'Produto atualizado com sucesso!' 
        : 'Produto criado com sucesso!' + 
          (imageUrl ? ' Imagem enviada.' : ' Sem imagem.')
      );
      
      // Limpar formulário se for novo produto
      if (!initialValues?.product_id) {
        resetForm();
        setSelectedImage(null);
        setImagePreview(null);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro detalhado no formulário:', error);
      alert(`Erro ao salvar o produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik<FormValues>
      initialValues={sanitizedInitialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ errors, touched, values, setFieldValue }) => (
        <Form className="space-y-6">
          {initialValues?.checkout_id && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Link do Checkout</h3>
                  <p className="text-sm text-gray-500 break-all">
                    {`${window.location.origin}/checkout/${initialValues.checkout_id}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCheckoutLink(initialValues.checkout_id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Copiar Link
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <Field
                type="text"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
              />
              {errors.name && touched.name && (
                <div className="text-sm text-red-600 mt-1">{typeof errors.name === 'string' ? errors.name : ''}</div>
              )}
            </div>

            {/* Nome de Exibição */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                Nome de Exibição
              </label>
              <Field
                type="text"
                name="display_name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
              />
              {errors.display_name && touched.display_name && (
                <div className="text-sm text-red-600 mt-1">{typeof errors.display_name === 'string' ? errors.display_name : ''}</div>
              )}
            </div>

            {/* Preço */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Preço
              </label>
              <Field
                type="number"
                name="price"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
              />
              {errors.price && touched.price && (
                <div className="text-sm text-red-600 mt-1">{typeof errors.price === 'string' ? errors.price : ''}</div>
              )}
            </div>

            {/* Preço Promocional */}
            <div>
              <label htmlFor="promotional_price" className="block text-sm font-medium text-gray-700">
                Preço Promocional
              </label>
              <Field
                type="number"
                name="promotional_price"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
              />
              {errors.promotional_price && touched.promotional_price && (
                <div className="text-sm text-red-600 mt-1">{typeof errors.promotional_price === 'string' ? errors.promotional_price : ''}</div>
              )}
            </div>

            {/* Tipo do Produto */}
            <div>
              <label htmlFor="product_type" className="block text-sm font-medium text-gray-700">
                Tipo do Produto
              </label>
              <Field
                as="select"
                name="product_type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
              >
                <option value="physical">Físico</option>
                <option value="digital">Digital</option>
              </Field>
              {errors.product_type && touched.product_type && (
                <div className="text-sm text-red-600 mt-1">{typeof errors.product_type === 'string' ? errors.product_type : ''}</div>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <Field
                as="select"
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="draft">Rascunho</option>
              </Field>
              {errors.status && touched.status && (
                <div className="text-sm text-red-600 mt-1">{typeof errors.status === 'string' ? errors.status : ''}</div>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <Field
              as="textarea"
              name="description"
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
            />
            {errors.description && touched.description && (
              <div className="text-sm text-red-600 mt-1">{typeof errors.description === 'string' ? errors.description : ''}</div>
            )}
          </div>

          {/* Campo de Upload de Imagem */}
          <div className="form-group">
            <label className="form-label">Imagem do Produto</label>
            <div className="flex items-center space-x-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="form-input"
              />
              {imagePreview && (
                <Image 
                  src={imagePreview} 
                  alt="Prévia da Imagem" 
                  width={100} 
                  height={100} 
                  className="rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          {/* Campos SEO */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de SEO</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="page_title" className="block text-sm font-medium text-gray-700">
                  Título da Página
                </label>
                <Field
                  type="text"
                  name="page_title"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.page_title && touched.page_title && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.page_title === 'string' ? errors.page_title : ''}</div>
                )}
              </div>
              <div>
                <label htmlFor="page_link" className="block text-sm font-medium text-gray-700">
                  Link da Página
                </label>
                <Field
                  type="text"
                  name="page_link"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.page_link && touched.page_link && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.page_link === 'string' ? errors.page_link : ''}</div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="page_description" className="block text-sm font-medium text-gray-700">
                  Descrição da Página
                </label>
                <Field
                  as="textarea"
                  name="page_description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.page_description && touched.page_description && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.page_description === 'string' ? errors.page_description : ''}</div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="page_content" className="block text-sm font-medium text-gray-700">
                  Conteúdo da Página
                </label>
                <Field
                  as="textarea"
                  name="page_content"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
              </div>
            </div>
          </div>

          {/* URLs de Redirecionamento */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">URLs de Redirecionamento</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="pix_boleto_redirect_url" className="block text-sm font-medium text-gray-700">
                  URL Redirecionamento Pix/Boleto
                </label>
                <Field
                  type="text"
                  name="pix_boleto_redirect_url"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.pix_boleto_redirect_url && touched.pix_boleto_redirect_url && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.pix_boleto_redirect_url === 'string' ? errors.pix_boleto_redirect_url : ''}</div>
                )}
              </div>
              <div>
                <label htmlFor="card_rejected_redirect_url" className="block text-sm font-medium text-gray-700">
                  URL Redirecionamento Cartão Recusado
                </label>
                <Field
                  type="text"
                  name="card_rejected_redirect_url"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.card_rejected_redirect_url && touched.card_rejected_redirect_url && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.card_rejected_redirect_url === 'string' ? errors.card_rejected_redirect_url : ''}</div>
                )}
              </div>
              <div>
                <label htmlFor="card_approved_redirect_url" className="block text-sm font-medium text-gray-700">
                  URL Redirecionamento Cartão Aprovado
                </label>
                <Field
                  type="text"
                  name="card_approved_redirect_url"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.card_approved_redirect_url && touched.card_approved_redirect_url && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.card_approved_redirect_url === 'string' ? errors.card_approved_redirect_url : ''}</div>
                )}
              </div>
            </div>
          </div>

          {/* Opções de Frete */}
          {values.product_type === 'physical' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opções de Frete</h3>
              <div className="space-y-4">
                {values.shipping_options.map((option: any, index: number) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Nome do Frete
                      </label>
                      <Field
                        name={`shipping_options.${index}.name`}
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ex: PAC, SEDEX"
                      />
                      {errors.shipping_options?.[index]?.name && touched.shipping_options?.[index]?.name && (
                        <div className="text-red-500 text-sm mt-1">{errors.shipping_options[index].name}</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Prazo de Entrega
                      </label>
                      <Field
                        name={`shipping_options.${index}.deadline`}
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ex: 5-7 dias úteis"
                      />
                      {errors.shipping_options?.[index]?.deadline && touched.shipping_options?.[index]?.deadline && (
                        <div className="text-red-500 text-sm mt-1">{errors.shipping_options[index].deadline}</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Preço
                      </label>
                      <Field
                        name={`shipping_options.${index}.price`}
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0.00"
                      />
                      {errors.shipping_options?.[index]?.price && touched.shipping_options?.[index]?.price && (
                        <div className="text-red-500 text-sm mt-1">{errors.shipping_options[index].price}</div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = [...values.shipping_options];
                        newOptions.splice(index, 1);
                        setFieldValue('shipping_options', newOptions);
                      }}
                      className="mt-6 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Remover
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setFieldValue('shipping_options', [
                      ...values.shipping_options,
                      { name: '', deadline: '', price: '' }
                    ]);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Adicionar Opção de Frete
                </button>
              </div>
            </div>
          )}

          {/* OrderBump */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">OrderBump</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="order_bump_product" className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <div className="relative">
                  <Field
                    as="select"
                    name="order_bump_product"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </option>
                    ))}
                  </Field>
                </div>
                {touched.order_bump_product && errors.order_bump_product && (
                  <p className="mt-1 text-sm text-red-600">{errors.order_bump_product}</p>
                )}
              </div>

              <div>
                <label htmlFor="order_bump_discount" className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto (%)
                </label>
                <Field
                  type="number"
                  name="order_bump_discount"
                  disabled={!values.order_bump_product}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {touched.order_bump_discount && errors.order_bump_discount && (
                  <p className="mt-1 text-sm text-red-600">{errors.order_bump_discount}</p>
                )}
              </div>
            </div>

            {values.order_bump_product && (
              <button
                type="button"
                onClick={() => {
                  setFieldValue('order_bump_product', '');
                  setFieldValue('order_bump_discount', 0);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remover OrderBump
              </button>
            )}
          </div>

          {/* Upsell */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Upsell</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="upsell_product" className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <div className="relative">
                  <Field
                    as="select"
                    name="upsell_product"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </option>
                    ))}
                  </Field>
                </div>
                {touched.upsell_product && errors.upsell_product && (
                  <p className="mt-1 text-sm text-red-600">{errors.upsell_product}</p>
                )}
              </div>

              <div>
                <label htmlFor="upsell_discount" className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto (%)
                </label>
                <Field
                  type="number"
                  name="upsell_discount"
                  disabled={!values.upsell_product}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {touched.upsell_discount && errors.upsell_discount && (
                  <p className="mt-1 text-sm text-red-600">{errors.upsell_discount}</p>
                )}
              </div>
            </div>

            {values.upsell_product && (
              <button
                type="button"
                onClick={() => {
                  setFieldValue('upsell_product', '');
                  setFieldValue('upsell_discount', 0);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remover Upsell
              </button>
            )}
          </div>

          {/* Produtos Relacionados */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="order_bump_product" className="block text-sm font-medium text-gray-700">
                  Order Bump
                </label>
                <Field
                  as="select"
                  name="order_bump_product"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                >
                  <option value="">Selecione um produto</option>
                  {/* Adicionar opções de produtos cadastrados */}
                </Field>
              </div>
              <div>
                <label htmlFor="upsell_product" className="block text-sm font-medium text-gray-700">
                  Upsell
                </label>
                <Field
                  as="select"
                  name="upsell_product"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                >
                  <option value="">Selecione um produto</option>
                  {/* Adicionar opções de produtos cadastrados */}
                </Field>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Formas de Pagamento</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="pix_discount" className="block text-sm font-medium text-gray-700">
                  Desconto Pix (%)
                </label>
                <Field
                  type="number"
                  name="pix_discount"
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.pix_discount && touched.pix_discount && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.pix_discount === 'string' ? errors.pix_discount : ''}</div>
                )}
              </div>
              <div>
                <label htmlFor="card_discount" className="block text-sm font-medium text-gray-700">
                  Desconto Cartão (%)
                </label>
                <Field
                  type="number"
                  name="card_discount"
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.card_discount && touched.card_discount && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.card_discount === 'string' ? errors.card_discount : ''}</div>
                )}
              </div>
              <div>
                <label htmlFor="boleto_discount" className="block text-sm font-medium text-gray-700">
                  Desconto Boleto (%)
                </label>
                <Field
                  type="number"
                  name="boleto_discount"
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#65D19C] focus:ring-[#65D19C]"
                />
                {errors.boleto_discount && touched.boleto_discount && (
                  <div className="text-sm text-red-600 mt-1">{typeof errors.boleto_discount === 'string' ? errors.boleto_discount : ''}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={Object.keys(errors).length > 0}
              className="inline-flex justify-center rounded-md border border-transparent bg-[#65D19C] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#58b589] focus:outline-none focus:ring-2 focus:ring-[#65D19C] focus:ring-offset-2 disabled:opacity-50"
            >
              Salvar Produto
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
