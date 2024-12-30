'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Database } from '@/lib/database.types';
import ProductList from '@/components/ProductList';
import ProductForm from '@/components/ProductForm';
import CheckoutSettings from '@/components/CheckoutSettings';
import { 
  LogOut, 
  Package, 
  Settings, 
  Tag,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users
} from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  discount: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '' });
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/dashadmin/login';
        return;
      }
      fetchCoupons();
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso');
      window.location.href = '/dashadmin/login';
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar cupons');
      return;
    }

    setCoupons(data || []);
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) return;

    const { error } = await supabase
      .from('coupons')
      .insert([
        {
          code: newCoupon.code,
          discount: parseInt(newCoupon.discount),
        },
      ]);

    if (error) {
      toast.error('Erro ao adicionar cupom');
      return;
    }

    setNewCoupon({ code: '', discount: '' });
    toast.success('Cupom adicionado com sucesso');
    fetchCoupons();
  };

  const handleDeleteCoupon = async (id: number) => {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao deletar cupom');
      return;
    }

    toast.success('Cupom deletado com sucesso');
    fetchCoupons();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        </div>
        
        <nav className="mt-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center w-full px-6 py-3 text-left ${
              activeTab === 'products'
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5 mr-3" />
            Produtos
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full px-6 py-3 text-left ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Configurações
          </button>
          
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center w-full px-6 py-3 text-left ${
              activeTab === 'coupons'
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Tag className="w-5 h-5 mr-3" />
            Cupons
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-6 py-3 text-left text-red-600 hover:bg-red-50 mt-auto"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Vendas Hoje</h3>
                <p className="text-2xl font-semibold text-gray-900">R$ 2.500</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Receita Total</h3>
                <p className="text-2xl font-semibold text-gray-900">R$ 45.850</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pedidos</h3>
                <p className="text-2xl font-semibold text-gray-900">125</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Clientes</h3>
                <p className="text-2xl font-semibold text-gray-900">1.250</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Products */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Produtos</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className={`px-4 py-2 rounded-lg ${
                    showForm
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {showForm ? 'Cancelar' : 'Adicionar Produto'}
                </button>
              </div>

              {showForm && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <ProductForm onSuccess={() => setShowForm(false)} />
                </div>
              )}

              <div className="bg-white rounded-lg">
                <ProductList />
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Configurações</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <CheckoutSettings />
              </div>
            </div>
          )}

          {/* Coupons */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Gerenciar Cupons</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome do Cupom</label>
                      <input
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        placeholder="ex: PROMO10"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Desconto (%)</label>
                      <input
                        type="number"
                        value={newCoupon.discount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                        placeholder="ex: 10"
                        min="0"
                        max="100"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleAddCoupon}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Adicionar Cupom
                  </button>

                  <div className="mt-6 space-y-2">
                    {coupons.map((coupon) => (
                      <div 
                        key={coupon.id} 
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{coupon.code}</span>
                          <span className="ml-2 text-sm text-gray-600">{coupon.discount}% de desconto</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
