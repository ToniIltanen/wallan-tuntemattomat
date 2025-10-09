/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

module.exports = { 
    basePath: isProd ? '/wallan-tuntemattomat' : '', assetPrefix: isProd ? '/wallan-tuntemattomat/' : '', 
    images: { unoptimized: true } 
};
