const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@arko/edge-auth', '@arko/ui'],
  poweredByHeader: false,
}
