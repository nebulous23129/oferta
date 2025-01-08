import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FormikErrors, FormikTouched } from 'formik';
import * as Yup from 'yup';
import { nanoid } from 'nanoid';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
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
  image_url?: string;
  pix_discount?: number;
  card_discount?: number;
  boleto_discount?: number;
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
  page_title: Yup.string()
    .max(70, 'Título da página não pode exceder 70 caracteres'),
  page_link: Yup.string()
    .matches(/^[a-z0-9-]+$/, 'Link da página deve conter apenas letras minúsculas, números e hífens'),
  page_description: Yup.string()
    .max(160, 'Descrição da página não pode exceder 160 caracteres'),
  page_content: Yup.string(),
  pix_boleto_redirect_url: Yup.string().url('URL de Pix/Boleto inválida'),
  card_rejected_redirect_url: Yup.string().url('URL de Cartão Recusado inválida'),
  card_approved_redirect_url: Yup.string().url('URL de Cartão Aprovado inválida'),
  shipping_options: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório'),
      price: Yup.number().required('Preço é obrigatório').min(0, 'Preço deve ser maior ou igual a 0'),
      deadline: Yup.string().required('Prazo é obrigatório')
    })
  ),
  pix_discount: Yup.number()
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode exceder 100%'),
  card_discount: Yup.number()
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode exceder 100%'),
  boleto_discount: Yup.number()
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode exceder 100%'),
  upsell_product: Yup.string(),
  upsell_discount: Yup.number()
    .transform((value) => (isNaN(value) || value === null ? 0 : value))
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode exceder 100%')
    .when('upsell_product', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required('Desconto é obrigatório quando há produto de upsell')
    }),
  order_bump_product: Yup.string(),
  order_bump_discount: Yup.number()
    .transform((value) => (isNaN(value) || value === null ? 0 : value))
    .min(0, 'Desconto deve ser maior ou igual a 0')
    .max(100, 'Desconto não pode exceder 100%')
    .when('order_bump_product', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required('Desconto é obrigatório quando há produto de order bump')
    })
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
  upsell_product: '',
  upsell_discount: 0,
  order_bump_product: '',
  order_bump_discount: 0,
  image_url: null,
  pix_discount: 0,
  card_discount: 0,
  boleto_discount: 0
};
