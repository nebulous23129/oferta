'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '@/lib/supabase';

interface PersonalInfoStepProps {
  onComplete: (data: any) => void;
  productId: number;
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  fullName: Yup.string()
    .min(3, 'Nome muito curto')
    .required('Nome completo é obrigatório'),
  cpf: Yup.string()
    .matches(/^\d{11}$/, 'CPF inválido')
    .required('CPF é obrigatório'),
  phone: Yup.string()
    .matches(/^\d{11}$/, 'Celular inválido')
    .required('Celular é obrigatório')
});

export default function PersonalInfoStep({ onComplete, productId }: PersonalInfoStepProps) {
  const [showFullForm, setShowFullForm] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      fullName: '',
      cpf: '',
      phone: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Buscar configurações do webhook
        const { data: settings } = await supabase
          .from('checkout_settings')
          .select('webhook_email, webhook_customer')
          .single();

        if (settings?.webhook_email) {
          // Disparar webhook de email
          await fetch(settings.webhook_email, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: values.email,
              productId
            })
          });
        }

        if (showFullForm && settings?.webhook_customer) {
          // Disparar webhook de customer
          await fetch(settings.webhook_customer, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values)
          });
        }

        // Disparar evento do Facebook Pixel
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'InitiateCheckout', {
            content_ids: [productId],
            content_type: 'product',
          });
        }

        onComplete(values);
      } catch (error) {
        console.error('Erro ao processar informações:', error);
      }
    }
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formik.values.email && !formik.errors.email) {
      setShowFullForm(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Informações Pessoais
      </h2>

      <form onSubmit={showFullForm ? formik.handleSubmit : handleEmailSubmit}>
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...formik.getFieldProps('email')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                formik.touched.email && formik.errors.email
                  ? 'border-red-300'
                  : ''
              }`}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>

          {showFullForm && (
            <>
              {/* Nome Completo */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="fullName"
                  {...formik.getFieldProps('fullName')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                    formik.touched.fullName && formik.errors.fullName
                      ? 'border-red-300'
                      : ''
                  }`}
                />
                {formik.touched.fullName && formik.errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.fullName}</p>
                )}
              </div>

              {/* CPF */}
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  type="text"
                  id="cpf"
                  {...formik.getFieldProps('cpf')}
                  maxLength={11}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                    formik.touched.cpf && formik.errors.cpf
                      ? 'border-red-300'
                      : ''
                  }`}
                />
                {formik.touched.cpf && formik.errors.cpf && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.cpf}</p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Celular
                </label>
                <input
                  type="text"
                  id="phone"
                  {...formik.getFieldProps('phone')}
                  maxLength={11}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                    formik.touched.phone && formik.errors.phone
                      ? 'border-red-300'
                      : ''
                  }`}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.phone}</p>
                )}
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {showFullForm ? 'Continuar' : 'Próximo'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
