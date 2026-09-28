export function publicApiUrl(path: string) {
  const base = process.env.ARKO_API_URL ||
    (process.env.VERCEL === '1' ? 'https://app.arkodevph.com' : '') ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3003' : '')
  if (!base) throw new Error('ARKO_API_URL is required for the public site')
  return new URL(path, base).toString()
}
