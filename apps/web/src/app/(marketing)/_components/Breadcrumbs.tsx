import Link from 'next/link'

const BASE = 'https://arkodevph.com'

export type Crumb = { label: string; href?: string }

export default function Breadcrumbs({
  items,
  className = '',
}: {
  items: Crumb[]
  className?: string
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE}${item.href}` } : {}),
    })),
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="mono flex flex-wrap items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.18em]">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {item.href ? (
              <Link
                href={item.href}
                className="underline decoration-2 underline-offset-4 transition-opacity hover:opacity-60"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="opacity-60">
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <span aria-hidden className="opacity-40">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
