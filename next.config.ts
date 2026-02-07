import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/register',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/superadmin',
        destination: '/admin/super',
        permanent: false,
      },
      {
        source: '/inout',
        destination: '/security',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
