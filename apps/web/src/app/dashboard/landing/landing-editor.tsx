'use client'

import { useState } from 'react'
import { Loader2, Check, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@arko/ui'
import { api } from '../../../lib/trpc/client'
import { DEFAULT_LANDING_CONTENT, type LandingContent } from '../../../lib/landing/content'

const inputCls =
  'w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black/40 dark:border-white/10 dark:bg-neutral-900'

// ── small field primitives ──────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-black/40 dark:text-white/40">{hint}</span> : null}
    </label>
  )
}

function Text({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
}

function Area({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className={inputCls} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
}

function Num({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      className={inputCls}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

// Add / remove / reorder controls for a list row.
function RowControls({
  onUp,
  onDown,
  onRemove,
}: {
  onUp: () => void
  onDown: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onUp} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10" title="Move up">
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={onDown} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10" title="Move down">
        <ArrowDown className="h-4 w-4" />
      </button>
      <button type="button" onClick={onRemove} className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" title="Remove">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// Move an item within an array (immutably handled by the caller's structuredClone).
function move<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
}

const SECTION_TOGGLES: { key: keyof LandingContent['sections']; label: string }[] = [
  { key: 'marquee', label: 'Marquee' },
  { key: 'stats', label: 'Stats' },
  { key: 'intro', label: 'Intro' },
  { key: 'services', label: 'Services' },
  { key: 'work', label: 'Work' },
  { key: 'process', label: 'Process' },
  { key: 'contact', label: 'Contact' },
]

type Status = 'idle' | 'saving' | 'success' | 'error'

export function LandingEditor() {
  const utils = api.useUtils()
  const { data, isLoading } = api.landing.get.useQuery()
  const [content, setContent] = useState<LandingContent | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string>()

  // Seed local editing state once the query resolves.
  const c = content ?? data ?? null

  const save = api.landing.update.useMutation({
    onMutate: () => {
      setStatus('saving')
      setError(undefined)
    },
    onSuccess: async (saved) => {
      setContent(saved)
      setStatus('success')
      await utils.landing.get.invalidate()
      setTimeout(() => setStatus('idle'), 2500)
    },
    onError: (err) => {
      setStatus('error')
      setError(err.message)
    },
  })

  if (isLoading || !c) {
    return (
      <div className="flex h-64 items-center justify-center text-black/40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // All edits go through structuredClone so state stays immutable.
  function update(fn: (draft: LandingContent) => void) {
    setContent((prev) => {
      const draft: LandingContent = structuredClone(prev ?? c!)
      fn(draft)
      return draft
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Landing page</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            Edit the public marketing site. Saving publishes immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
          >
            View site <ExternalLink className="h-4 w-4" />
          </a>
          <Button onClick={() => save.mutate(c)} disabled={status === 'saving'}>
            {status === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save & publish
          </Button>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
          <Check className="h-4 w-4" /> Saved and published.
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4" /> {error ?? 'Something went wrong.'}
        </div>
      ) : null}

      {/* Section visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Toggle which sections appear on the landing page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {SECTION_TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={c.sections[key]}
                onChange={(e) => update((d) => { d.sections[key] = e.target.checked })}
              />
              {label}
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Hero */}
      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Eyebrow">
            <Text value={c.hero.eyebrow} onChange={(v) => update((d) => { d.hero.eyebrow = v })} />
          </Field>
          <Field label="Heading lead">
            <Text value={c.hero.headingLead} onChange={(v) => update((d) => { d.hero.headingLead = v })} />
          </Field>
          <Field label="Rotating roles" hint="Shown in the animated highlight after the heading.">
            <div className="space-y-2">
              {c.hero.roles.map((role, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={inputCls} value={role} onChange={(e) => update((d) => { d.hero.roles[i] = e.target.value })} />
                  <RowControls
                    onUp={() => update((d) => move(d.hero.roles, i, i - 1))}
                    onDown={() => update((d) => move(d.hero.roles, i, i + 1))}
                    onRemove={() => update((d) => { d.hero.roles.splice(i, 1) })}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update((d) => { d.hero.roles.push('new role') })}>
                <Plus className="mr-1 h-4 w-4" /> Add role
              </Button>
            </div>
          </Field>
          <Field label="Paragraph">
            <Area value={c.hero.paragraph} onChange={(v) => update((d) => { d.hero.paragraph = v })} />
          </Field>
        </CardContent>
      </Card>

      {/* Marquee */}
      <Card>
        <CardHeader>
          <CardTitle>Marquee</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Words" hint="Repeated across the scrolling band.">
            <Text value={c.marquee.words} onChange={(v) => update((d) => { d.marquee.words = v })} />
          </Field>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
          <CardDescription>Leave “display text” blank to show the counter; type a value to show raw text instead.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {c.stats.map((s, i) => (
            <div key={i} className="grid gap-3 rounded-md border border-black/10 p-3 md:grid-cols-[1fr_1fr_2fr_auto] dark:border-white/10">
              <Field label="Count to"><Num value={s.to} onChange={(v) => update((d) => { d.stats[i].to = v })} /></Field>
              <Field label="Suffix"><Text value={s.suffix} onChange={(v) => update((d) => { d.stats[i].suffix = v })} /></Field>
              <Field label="Label"><Text value={s.label} onChange={(v) => update((d) => { d.stats[i].label = v })} /></Field>
              <div className="flex items-end pb-1">
                <RowControls
                  onUp={() => update((d) => move(d.stats, i, i - 1))}
                  onDown={() => update((d) => move(d.stats, i, i + 1))}
                  onRemove={() => update((d) => { d.stats.splice(i, 1) })}
                />
              </div>
              <div className="md:col-span-4">
                <Field label="Display text (overrides counter)">
                  <Text
                    value={s.displayText ?? ''}
                    onChange={(v) => update((d) => { d.stats[i].displayText = v === '' && s.displayText === undefined ? undefined : v })}
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update((d) => { d.stats.push({ to: 0, suffix: '', label: 'New stat' }) })}>
            <Plus className="mr-1 h-4 w-4" /> Add stat
          </Button>
        </CardContent>
      </Card>

      {/* Intro */}
      <Card>
        <CardHeader>
          <CardTitle>Intro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Heading"><Text value={c.intro.heading} onChange={(v) => update((d) => { d.intro.heading = v })} /></Field>
          <Field label="Eyebrow note"><Text value={c.intro.eyebrowNote} onChange={(v) => update((d) => { d.intro.eyebrowNote = v })} /></Field>
          <Field label="Body — before highlight"><Area value={c.intro.bodyBefore} onChange={(v) => update((d) => { d.intro.bodyBefore = v })} /></Field>
          <Field label="Body — highlighted phrase"><Text value={c.intro.bodyHighlight} onChange={(v) => update((d) => { d.intro.bodyHighlight = v })} /></Field>
          <Field label="Body — after highlight"><Area value={c.intro.bodyAfter} onChange={(v) => update((d) => { d.intro.bodyAfter = v })} /></Field>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Label"><Text value={c.services.label} onChange={(v) => update((d) => { d.services.label = v })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Video URL" hint="e.g. /services.mp4 (upload to /public or paste a URL).">
              <Text value={c.services.videoSrc} onChange={(v) => update((d) => { d.services.videoSrc = v })} />
            </Field>
            <Field label="Poster image URL" hint="e.g. /services-poster.jpg">
              <Text value={c.services.poster} onChange={(v) => update((d) => { d.services.poster = v })} />
            </Field>
          </div>
          <Field label="CTA label (on final slide)"><Text value={c.services.ctaLabel} onChange={(v) => update((d) => { d.services.ctaLabel = v })} /></Field>
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">Slides</span>
            {c.services.slides.map((s, i) => (
              <div key={i} className="grid gap-3 rounded-md border border-black/10 p-3 md:grid-cols-[1fr_1fr_auto_auto] dark:border-white/10">
                <Field label="Lead"><Text value={s.lead} onChange={(v) => update((d) => { d.services.slides[i].lead = v })} /></Field>
                <Field label="Accent"><Text value={s.accent} onChange={(v) => update((d) => { d.services.slides[i].accent = v })} /></Field>
                <label className="flex items-end gap-2 pb-2 text-xs">
                  <input type="checkbox" checked={!!s.resolve} onChange={(e) => update((d) => { d.services.slides[i].resolve = e.target.checked || undefined })} />
                  CTA slide
                </label>
                <div className="flex items-end pb-1">
                  <RowControls
                    onUp={() => update((d) => move(d.services.slides, i, i - 1))}
                    onDown={() => update((d) => move(d.services.slides, i, i + 1))}
                    onRemove={() => update((d) => { d.services.slides.splice(i, 1) })}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update((d) => { d.services.slides.push({ lead: 'Lead', accent: 'accent?' }) })}>
              <Plus className="mr-1 h-4 w-4" /> Add slide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work */}
      <Card>
        <CardHeader>
          <CardTitle>Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Eyebrow"><Text value={c.work.eyebrow} onChange={(v) => update((d) => { d.work.eyebrow = v })} /></Field>
            <Field label="Heading"><Text value={c.work.heading} onChange={(v) => update((d) => { d.work.heading = v })} /></Field>
            <Field label="Subtitle"><Text value={c.work.subtitle} onChange={(v) => update((d) => { d.work.subtitle = v })} /></Field>
          </div>
          <Field label="CTA label"><Text value={c.work.ctaLabel} onChange={(v) => update((d) => { d.work.ctaLabel = v })} /></Field>
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">Cards</span>
            {c.work.cards.map((card, i) => (
              <div key={i} className="space-y-3 rounded-md border border-black/10 p-3 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/40">Card {i + 1}</span>
                  <RowControls
                    onUp={() => update((d) => move(d.work.cards, i, i - 1))}
                    onDown={() => update((d) => move(d.work.cards, i, i + 1))}
                    onRemove={() => update((d) => { d.work.cards.splice(i, 1) })}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <Field label="Kind"><Text value={card.kind} onChange={(v) => update((d) => { d.work.cards[i].kind = v })} /></Field>
                  <Field label="Title"><Text value={card.title} onChange={(v) => update((d) => { d.work.cards[i].title = v })} /></Field>
                  <Field label="Icon"><Text value={card.icon} onChange={(v) => update((d) => { d.work.cards[i].icon = v })} /></Field>
                </div>
                <Field label="Copy"><Area value={card.copy} onChange={(v) => update((d) => { d.work.cards[i].copy = v })} rows={2} /></Field>
                <Field label="Tags (comma-separated)">
                  <Text
                    value={card.tags.join(', ')}
                    onChange={(v) => update((d) => { d.work.cards[i].tags = v.split(',').map((t) => t.trim()).filter(Boolean) })}
                  />
                </Field>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update((d) => { d.work.cards.push({ kind: 'kind', title: 'Title', copy: '', tags: [], icon: '◆' }) })}>
              <Plus className="mr-1 h-4 w-4" /> Add card
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Process */}
      <Card>
        <CardHeader>
          <CardTitle>Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Eyebrow"><Text value={c.process.eyebrow} onChange={(v) => update((d) => { d.process.eyebrow = v })} /></Field>
            <Field label="Heading"><Text value={c.process.heading} onChange={(v) => update((d) => { d.process.heading = v })} /></Field>
            <Field label="Subtitle"><Text value={c.process.subtitle} onChange={(v) => update((d) => { d.process.subtitle = v })} /></Field>
          </div>
          <Field label="CTA label"><Text value={c.process.ctaLabel} onChange={(v) => update((d) => { d.process.ctaLabel = v })} /></Field>
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">Steps</span>
            {c.process.steps.map((step, i) => (
              <div key={i} className="space-y-3 rounded-md border border-black/10 p-3 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/40">Step {i + 1}</span>
                  <RowControls
                    onUp={() => update((d) => move(d.process.steps, i, i - 1))}
                    onDown={() => update((d) => move(d.process.steps, i, i + 1))}
                    onRemove={() => update((d) => { d.process.steps.splice(i, 1) })}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <Field label="Number"><Text value={step.n} onChange={(v) => update((d) => { d.process.steps[i].n = v })} /></Field>
                  <Field label="Title"><Text value={step.title} onChange={(v) => update((d) => { d.process.steps[i].title = v })} /></Field>
                  <Field label="Icon"><Text value={step.icon} onChange={(v) => update((d) => { d.process.steps[i].icon = v })} /></Field>
                </div>
                <Field label="Body"><Area value={step.body} onChange={(v) => update((d) => { d.process.steps[i].body = v })} rows={2} /></Field>
                <Field label="Detail"><Area value={step.detail} onChange={(v) => update((d) => { d.process.steps[i].detail = v })} rows={3} /></Field>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update((d) => { d.process.steps.push({ n: '00', title: 'Title', body: '', detail: '', icon: '◆' }) })}>
              <Plus className="mr-1 h-4 w-4" /> Add step
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Heading line 1"><Text value={c.contact.headingLine1} onChange={(v) => update((d) => { d.contact.headingLine1 = v })} /></Field>
            <Field label="Heading line 2"><Text value={c.contact.headingLine2} onChange={(v) => update((d) => { d.contact.headingLine2 = v })} /></Field>
          </div>
          <Field label="Paragraph"><Area value={c.contact.paragraph} onChange={(v) => update((d) => { d.contact.paragraph = v })} /></Field>
          <Field label="Email"><Text value={c.contact.email} onChange={(v) => update((d) => { d.contact.email = v })} /></Field>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Brand blurb"><Area value={c.footer.brandBlurb} onChange={(v) => update((d) => { d.footer.brandBlurb = v })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email"><Text value={c.footer.email} onChange={(v) => update((d) => { d.footer.email = v })} /></Field>
            <Field label="GitHub URL"><Text value={c.footer.githubUrl} onChange={(v) => update((d) => { d.footer.githubUrl = v })} /></Field>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">“What we do” links</span>
            {c.footer.whatWeDo.map((link, i) => (
              <div key={i} className="grid gap-3 rounded-md border border-black/10 p-3 md:grid-cols-[2fr_1fr_auto] dark:border-white/10">
                <Field label="Label"><Text value={link.label} onChange={(v) => update((d) => { d.footer.whatWeDo[i].label = v })} /></Field>
                <Field label="Href"><Text value={link.href} onChange={(v) => update((d) => { d.footer.whatWeDo[i].href = v })} /></Field>
                <div className="flex items-end pb-1">
                  <RowControls
                    onUp={() => update((d) => move(d.footer.whatWeDo, i, i - 1))}
                    onDown={() => update((d) => move(d.footer.whatWeDo, i, i + 1))}
                    onRemove={() => update((d) => { d.footer.whatWeDo.splice(i, 1) })}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update((d) => { d.footer.whatWeDo.push({ label: 'New link', href: '#work' }) })}>
              <Plus className="mr-1 h-4 w-4" /> Add link
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="CTA line 1"><Text value={c.footer.ctaLine1} onChange={(v) => update((d) => { d.footer.ctaLine1 = v })} /></Field>
            <Field label="CTA line 2"><Text value={c.footer.ctaLine2} onChange={(v) => update((d) => { d.footer.ctaLine2 = v })} /></Field>
            <Field label="CTA line 3"><Text value={c.footer.ctaLine3} onChange={(v) => update((d) => { d.footer.ctaLine3 = v })} /></Field>
          </div>
          <Field label="Location"><Text value={c.footer.location} onChange={(v) => update((d) => { d.footer.location = v })} /></Field>
        </CardContent>
      </Card>

      {/* Projects (the /projects gallery page) */}
      <Card>
        <CardHeader>
          <CardTitle>Projects page</CardTitle>
          <CardDescription>The dedicated /projects gallery. Filter categories are generated from each project&apos;s Category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow"><Text value={c.projects.eyebrow} onChange={(v) => update((d) => { d.projects.eyebrow = v })} /></Field>
            <Field label="Heading"><Text value={c.projects.heading} onChange={(v) => update((d) => { d.projects.heading = v })} /></Field>
          </div>
          <Field label="Intro"><Area value={c.projects.intro} onChange={(v) => update((d) => { d.projects.intro = v })} /></Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="CTA eyebrow"><Text value={c.projects.ctaEyebrow} onChange={(v) => update((d) => { d.projects.ctaEyebrow = v })} /></Field>
            <Field label="CTA heading"><Text value={c.projects.ctaHeading} onChange={(v) => update((d) => { d.projects.ctaHeading = v })} /></Field>
            <Field label="CTA button label"><Text value={c.projects.ctaLabel} onChange={(v) => update((d) => { d.projects.ctaLabel = v })} /></Field>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">Projects</span>
            {c.projects.items.map((project, i) => (
              <div key={i} className="space-y-3 rounded-md border border-black/10 p-3 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/40">Project {i + 1}</span>
                  <RowControls
                    onUp={() => update((d) => move(d.projects.items, i, i - 1))}
                    onDown={() => update((d) => move(d.projects.items, i, i + 1))}
                    onRemove={() => update((d) => { d.projects.items.splice(i, 1) })}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[auto_2fr_1fr]">
                  <Field label="Number"><Text value={project.number} onChange={(v) => update((d) => { d.projects.items[i].number = v })} /></Field>
                  <Field label="Title"><Text value={project.title} onChange={(v) => update((d) => { d.projects.items[i].title = v })} /></Field>
                  <Field label="Category"><Text value={project.category} onChange={(v) => update((d) => { d.projects.items[i].category = v })} /></Field>
                </div>
                <Field label="Type / description"><Text value={project.type} onChange={(v) => update((d) => { d.projects.items[i].type = v })} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Domain (shown)"><Text value={project.domain} onChange={(v) => update((d) => { d.projects.items[i].domain = v })} /></Field>
                  <Field label="Live URL (href)"><Text value={project.href} onChange={(v) => update((d) => { d.projects.items[i].href = v })} /></Field>
                </div>
                <Field label="Preview image URL" hint="e.g. /projects/my-site-preview.png"><Text value={project.image} onChange={(v) => update((d) => { d.projects.items[i].image = v })} /></Field>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update((d) => { d.projects.items.push({ number: String(d.projects.items.length + 1).padStart(2, '0'), title: 'New project', category: 'Uncategorized', type: '', domain: '', href: '', image: '' }) })}>
              <Plus className="mr-1 h-4 w-4" /> Add project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* reset + save footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setContent(structuredClone(DEFAULT_LANDING_CONTENT))}
          title="Reset all fields to the original defaults (not saved until you publish)"
        >
          Reset to defaults
        </Button>
        <Button onClick={() => save.mutate(c)} disabled={status === 'saving'}>
          {status === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save & publish
        </Button>
      </div>
    </div>
  )
}
