'use client';

import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { supabase } from '@/lib/supabase';
import '@/styles/admin.css';

interface CheckoutSettingsType {
  pix_boleto_redirect_url: string;
  card_rejected_redirect_url: string;
  card_approved_redirect_url: string;
  webhook_email: string;
  webhook_customer: string;
  webhook_address: string;
  webhook_payment: string;
  apikey_secret: string;
  apikey_user: string;
  facebook_pixel: string;
  custom_css: string;
  id?: number;
}

const validationSchema = Yup.object().shape({
  // URLs de redirecionamento
  pix_boleto_redirect_url: Yup.string().url('URL inválida').nullable(),
  card_rejected_redirect_url: Yup.string().url('URL inválida').nullable(),
  card_approved_redirect_url: Yup.string().url('URL inválida').nullable(),
  
  // Webhooks
  webhook_email: Yup.string().url('URL inválida').nullable(),
  webhook_customer: Yup.string().url('URL inválida').nullable(),
  webhook_address: Yup.string().url('URL inválida').nullable(),
  webhook_payment: Yup.string().url('URL inválida').nullable(),
  
  // Chaves de API
  apikey_secret: Yup.string().nullable(),
  apikey_user: Yup.string().nullable(),
  facebook_pixel: Yup.string().nullable(),
  
  // CSS Personalizado
  custom_css: Yup.string().nullable(),
});

const initialValues = {
  pix_boleto_redirect_url: '',
  card_rejected_redirect_url: '',
  card_approved_redirect_url: '',
  webhook_email: '',
  webhook_customer: '',
  webhook_address: '',
  webhook_payment: '',
  apikey_secret: '',
  apikey_user: '',
  facebook_pixel: '',
  custom_css: '',
};

export default function CheckoutSettings() {
  const [settings, setSettings] = useState<CheckoutSettingsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Buscando configurações...');
      const { data, error } = await supabase
        .from('checkout_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro Supabase:', error);
        throw error;
      }

      console.log('Configurações encontradas:', data);
      setSettings(data || initialValues);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(initialValues);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      console.log('Salvando configurações:', values);
      let result;
      
      if (settings?.id) {
        result = await supabase
          .from('checkout_settings')
          .update(values)
          .eq('id', settings.id);
      } else {
        result = await supabase
          .from('checkout_settings')
          .insert([values])
          .select();
      }

      if (result.error) {
        console.error('Erro ao salvar:', result.error);
        throw result.error;
      }
      
      console.log('Configurações salvas:', result.data);
      alert('Configurações salvas com sucesso!');
      fetchSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6">      
      <Formik
        initialValues={settings || initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-8">
            {/* URLs de Redirecionamento */}
            <div className="form-section">
              <h2 className="section-title">URLs de Redirecionamento</h2>
              <p className="section-description">
                Configure as URLs para redirecionamento após diferentes status de pagamento.
              </p>
              <div className="space-y-6">
                <div className="form-group">
                  <label htmlFor="pix_boleto_redirect_url" className="form-label">
                    URL de Redirecionamento Pix/Boleto
                  </label>
                  <Field
                    type="text"
                    name="pix_boleto_redirect_url"
                    className="form-input"
                    placeholder="https://seu-site.com/sucesso-pix-boleto"
                  />
                  {errors.pix_boleto_redirect_url && touched.pix_boleto_redirect_url && (
                    <div className="form-error">{errors.pix_boleto_redirect_url}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="card_rejected_redirect_url" className="form-label">
                    URL de Redirecionamento Cartão Recusado
                  </label>
                  <Field
                    type="text"
                    name="card_rejected_redirect_url"
                    className="form-input"
                    placeholder="https://seu-site.com/cartao-recusado"
                  />
                  {errors.card_rejected_redirect_url && touched.card_rejected_redirect_url && (
                    <div className="form-error">{errors.card_rejected_redirect_url}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="card_approved_redirect_url" className="form-label">
                    URL de Redirecionamento Cartão Aprovado
                  </label>
                  <Field
                    type="text"
                    name="card_approved_redirect_url"
                    className="form-input"
                    placeholder="https://seu-site.com/sucesso-cartao"
                  />
                  {errors.card_approved_redirect_url && touched.card_approved_redirect_url && (
                    <div className="form-error">{errors.card_approved_redirect_url}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Webhooks */}
            <div className="form-section">
              <h2 className="section-title">Webhooks</h2>
              <p className="section-description">
                Configure os endpoints para receber notificações de eventos.
              </p>
              <div className="space-y-6">
                <div className="form-group">
                  <label htmlFor="webhook_email" className="form-label">
                    Webhook Email
                  </label>
                  <Field
                    type="text"
                    name="webhook_email"
                    className="form-input"
                    placeholder="https://seu-site.com/webhook/email"
                  />
                  {errors.webhook_email && touched.webhook_email && (
                    <div className="form-error">{errors.webhook_email}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="webhook_customer" className="form-label">
                    Webhook Customer
                  </label>
                  <Field
                    type="text"
                    name="webhook_customer"
                    className="form-input"
                    placeholder="https://seu-site.com/webhook/customer"
                  />
                  {errors.webhook_customer && touched.webhook_customer && (
                    <div className="form-error">{errors.webhook_customer}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="webhook_address" className="form-label">
                    Webhook Address
                  </label>
                  <Field
                    type="text"
                    name="webhook_address"
                    className="form-input"
                    placeholder="https://seu-site.com/webhook/address"
                  />
                  {errors.webhook_address && touched.webhook_address && (
                    <div className="form-error">{errors.webhook_address}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="webhook_payment" className="form-label">
                    Webhook Payment
                  </label>
                  <Field
                    type="text"
                    name="webhook_payment"
                    className="form-input"
                    placeholder="https://seu-site.com/webhook/payment"
                  />
                  {errors.webhook_payment && touched.webhook_payment && (
                    <div className="form-error">{errors.webhook_payment}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Chaves de API */}
            <div className="form-section">
              <h2 className="section-title">Chaves de API</h2>
              <p className="section-description">
                Configure suas chaves de API e integrações.
              </p>
              <div className="space-y-6">
                <div className="form-group">
                  <label htmlFor="apikey_secret" className="form-label">
                    API Key Secret
                  </label>
                  <Field
                    type="password"
                    name="apikey_secret"
                    className="form-input"
                    placeholder="••••••••••••••••"
                  />
                  {errors.apikey_secret && touched.apikey_secret && (
                    <div className="form-error">{errors.apikey_secret}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="apikey_user" className="form-label">
                    API Key User
                  </label>
                  <Field
                    type="text"
                    name="apikey_user"
                    className="form-input"
                    placeholder="Sua chave de API pública"
                  />
                  {errors.apikey_user && touched.apikey_user && (
                    <div className="form-error">{errors.apikey_user}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="facebook_pixel" className="form-label">
                    Pixel do Facebook
                  </label>
                  <Field
                    type="text"
                    name="facebook_pixel"
                    className="form-input"
                    placeholder="ID do seu Pixel do Facebook"
                  />
                  {errors.facebook_pixel && touched.facebook_pixel && (
                    <div className="form-error">{errors.facebook_pixel}</div>
                  )}
                </div>
              </div>
            </div>

            {/* CSS Personalizado */}
            <div className="form-section">
              <h2 className="section-title">CSS Personalizado</h2>
              <p className="section-description">
                Adicione seu CSS personalizado para customizar a aparência do checkout.
              </p>
              <div className="space-y-6">
                <div className="form-group">
                  <label htmlFor="custom_css" className="form-label">
                    CSS Personalizado
                  </label>
                  <Field
                    as="textarea"
                    name="custom_css"
                    className="form-input min-h-[200px] font-mono text-sm"
                    placeholder=".checkout-page { /* seus estilos aqui */ }"
                  />
                  {errors.custom_css && touched.custom_css && (
                    <div className="form-error">{errors.custom_css}</div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Insira seu CSS personalizado aqui. Este CSS será aplicado à página de checkout.
                  </p>
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="admin-button admin-button-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
