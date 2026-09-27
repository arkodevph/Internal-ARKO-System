const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@arko/db', '@arko/finance', '@arko/tasks', '@arko/workflows', '@arko/dashboard'],
  poweredByHeader: false,
}
