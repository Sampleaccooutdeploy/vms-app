/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/visitor',
                destination: '/register',
                permanent: true,
            },
            {
                source: '/admin',
                destination: '/login?role=department_admin',
                permanent: true,
            },
            {
                source: '/inout',
                destination: '/security',
                permanent: true,
            },
        ]
    },
};

module.exports = nextConfig;
