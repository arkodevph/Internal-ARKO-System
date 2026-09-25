const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@arko/ui', '@arko/db'],
  poweredByHeader: false,
}

module.exports = nextConfig
