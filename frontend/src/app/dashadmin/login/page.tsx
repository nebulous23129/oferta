'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashadmin');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Erro ao fazer login: ' + error.message);
        return;
      }

      if (data?.user) {
        toast.success('Login realizado com sucesso!');
        window.location.href = '/dashadmin';
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
      <div className="w-[400px] bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="flex items-center justify-between text-sm text-white/80">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10"
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="hover:text-white">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-gray-900 rounded-md font-medium hover:bg-white/90 transition-colors"
          >
            {loading ? 'Entrando...' : 'LOGIN'}
          </button>

          <button
            type="button"
            className="w-full py-3 border border-white/20 text-white rounded-md font-medium hover:bg-white/10 transition-colors"
          >
            REGISTER
          </button>
        </form>
      </div>
    </div>
  );
}
