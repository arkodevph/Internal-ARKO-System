'use client'

import { useState } from 'react'
import { Card, CardContent, Button } from '@arko/ui'
import { Lightbulb, Plus, Trash2, Loader2, ArrowRight } from 'lucide-react'
import { api } from '../../../lib/trpc/client'
import { RecordScopeBadge, RecordScopeField } from '../../../components/record-scope'
import type { RecordScope } from '../../../lib/record-scope'
import { useSession } from 'next-auth/react'
import { useWorkspaceScope } from '../../../components/workspace-scope'

const STATUSES = ['IDEA', 'EXPLORING', 'VALIDATED', 'ARCHIVED'] as const

export default function IdeasPage() {
  const { data: session } = useSession()
  const { scope: workspaceScope } = useWorkspaceScope()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<RecordScope>(workspaceScope)

  const { data: ideas, isLoading } = api.ideas.list.useQuery()
  const utils = api.useUtils()

  const create = api.ideas.create.useMutation({
    onSuccess: () => {
      setTitle('')
      setDescription('')
      setShowForm(false)
      utils.ideas.list.invalidate()
    },
  })
  const del = api.ideas.delete.useMutation({
    onSuccess: () => utils.ideas.list.invalidate(),
  })
  const spawn = api.ideas.spawnTask.useMutation({
    onSuccess: () => utils.ideas.list.invalidate(),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Ideas</h1>
          <p className="mt-1 text-sm text-text-tertiary">Capture and validate ideas</p>
        </div>
        <Button size="sm" onClick={() => {
          if (!showForm) setScope(workspaceScope)
          setShowForm(!showForm)
        }}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (title.trim()) create.mutate({ title: title.trim(), description, scope })
              }}
              className="space-y-3"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Idea title..."
                autoFocus
                required
                className="block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe it..."
                rows={3}
                className="block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <RecordScopeField value={scope} onChange={setScope} />
              <Button type="submit" size="sm" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : !ideas?.some((idea) => idea.scope === workspaceScope) ? (
        <Card className="border-dashed border-border-subtle">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Lightbulb className="mb-3 h-8 w-8 text-text-tertiary" />
            <p className="text-sm text-text-tertiary">No ideas yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {ideas?.filter((idea) => idea.scope === workspaceScope).map((idea) => (
            <Card key={idea.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">{idea.title}</p>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-text-tertiary">{idea.status}</span>
                    <RecordScopeBadge scope={idea.scope} />
                  </div>
                  {idea.description && <p className="mt-1 line-clamp-2 text-xs text-text-tertiary">{idea.description}</p>}
                </div>
                {!idea.spawnedTaskId && (idea.userId === session?.user?.id || session?.user?.role === 'ADMIN') && (
                  <button
                    title="Spawn task"
                    onClick={() => spawn.mutate({ id: idea.id })}
                    className="shrink-0 rounded-lg p-1 text-text-muted hover:bg-accent-500/10 hover:text-primary-600"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                {(idea.userId === session?.user?.id || session?.user?.role === 'ADMIN') && (
                  <button
                    onClick={() => confirm('Delete this idea?') && del.mutate({ id: idea.id })}
                    className="shrink-0 rounded-lg p-1 text-text-muted hover:bg-neg-bg hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
