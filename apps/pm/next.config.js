const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname, '../../'),
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@arko/ui', '@arko/edge-auth'],
  poweredByHeader: false,
}

module.exports = nextConfig
