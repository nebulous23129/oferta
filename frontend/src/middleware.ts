import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Atualiza a sessão se existir um token de atualização
  const { data: { session } } = await supabase.auth.getSession();

  // Se estiver tentando acessar /dashadmin e não estiver logado
  if (req.nextUrl.pathname.startsWith('/dashadmin') && !req.nextUrl.pathname.includes('/login')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/dashadmin/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Se estiver logado e tentar acessar a página de login
  if (req.nextUrl.pathname === '/dashadmin/login') {
    if (session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/dashadmin';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashadmin/:path*'],
};
