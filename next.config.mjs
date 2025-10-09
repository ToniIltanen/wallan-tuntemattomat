/** @type {import('next').NextConfig} */

const isProd = process.env.PRODUCTION
const nextConfig = {
    output: 'export',
    basePath: isProd ? '/wallan-tuntemattomat' : '', 
    assetPrefix: isProd ? '/wallan-tuntemattomat/' : '', 
    images: { unoptimized: true }
};

export default nextConfig;
