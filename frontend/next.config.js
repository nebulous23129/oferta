/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'via.placeholder.com',
      'localhost',
      '127.0.0.1',
      'descontos-do-dia-mercadolivre.com',
      'lskmcjokwqfeqomawhtb.supabase.co', // Adicionado domínio do Supabase
      'github.bubbstore.com',
      'placehold.co'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/webhook/:path*',
        destination: 'https://autowebook.7sevenpay.com.br/webhook/:path*'
      }
    ]
  },
  // Suppress specific hydration warnings
  compiler: {
    styledComponents: true,
  },
}

module.exports = nextConfig
