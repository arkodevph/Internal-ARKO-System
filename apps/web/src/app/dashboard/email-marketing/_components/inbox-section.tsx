"use client";

import { useState } from "react";
import { Button, Card, CardContent } from "@arko/ui";
import { Archive, Inbox, MessageSquareText, Send, Trash2 } from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { toast } from "../../../../components/toaster";
import { EmptyState, fieldClass, formatDate, StatusBadge } from "./shared";

type InboxStatus = "UNREAD" | "OPEN" | "DONE" | "TRASHED";

export function InboxSection() {
  const [filter, setFilter] = useState<InboxStatus | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const messages = api.emailMarketing.inbox.list.useQuery(
    filter ? { status: filter } : {},
  );
  const lookups = api.emailMarketing.lookups.useQuery();
  const utils = api.useUtils();
  const update = api.emailMarketing.inbox.update.useMutation({
    onSuccess: async () => {
      await messages.refetch();
      await utils.emailMarketing.overview.invalidate();
    },
  });
  const addNote = api.emailMarketing.inbox.addNote.useMutation({
    onSuccess: async () => {
      await messages.refetch();
      setNote("");
      toast("Internal note added");
    },
  });
  const selected =
    messages.data?.find((message) => message.id === selectedId) ??
    messages.data?.[0];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Marketing inbox
        </h2>
        <p className="text-xs text-text-tertiary">
          Inbound replies kept separate from internal ARKO messages.
        </p>
      </div>
      <div className="flex gap-1">
        {([undefined, "UNREAD", "OPEN", "DONE", "TRASHED"] as const).map(
          (status) => (
            <button
              key={status ?? "ALL"}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === status ? "bg-primary-500/10 text-primary-500" : "text-text-tertiary"}`}
            >
              {status ?? "ALL"}
            </button>
          ),
        )}
      </div>
      {!messages.data?.length ? (
        <EmptyState
          title="Inbox is clear"
          detail="Verified provider replies will appear here."
        />
      ) : (
        <div className="grid min-h-[560px] gap-4 xl:grid-cols-[360px_1fr]">
          <Card className="overflow-hidden hover:translate-y-0">
            <CardContent className="divide-y divide-border-subtle p-0">
              {messages.data.map((message) => (
                <button
                  key={message.id}
                  onClick={() => {
                    setSelectedId(message.id);
                    if (message.status === "UNREAD")
                      update.mutate({ id: message.id, status: "OPEN" });
                  }}
                  className={`block w-full p-4 text-left transition hover:bg-card/[0.04] ${selected?.id === message.id ? "bg-primary-500/5" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
                      {message.senderName || message.senderEmail}
                    </p>
                    <StatusBadge value={message.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-text-secondary">
                    {message.subject}
                  </p>
                  <p className="mt-1 text-[10px] text-text-tertiary">
                    {formatDate(message.receivedAt)}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
          {selected && (
            <Card className="hover:translate-y-0">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 border-b border-border-subtle pb-4 sm:flex-row sm:items-start">
                  <div className="rounded-lg bg-primary-500/10 p-2 text-primary-500">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-primary">
                      {selected.subject}
                    </h3>
                    <p className="mt-1 text-xs text-text-tertiary">
                      From {selected.senderName || selected.senderEmail} &lt;
                      {selected.senderEmail}&gt; ·{" "}
                      {formatDate(selected.receivedAt)}
                    </p>
                    {selected.contact && (
                      <p className="mt-1 text-xs text-primary-500">
                        Linked contact:{" "}
                        {selected.contact.firstName || selected.contact.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        update.mutate({ id: selected.id, status: "DONE" })
                      }
                    >
                      <Archive className="h-3.5 w-3.5" /> Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        update.mutate({ id: selected.id, status: "TRASHED" })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="min-h-56 whitespace-pre-wrap py-5 text-sm leading-7 text-text-secondary">
                  {selected.textBody ||
                    "This message has HTML content only. HTML rendering is disabled here for safety."}
                </div>
                <div className="border-t border-border-subtle pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-text-tertiary" />
                    <p className="text-xs font-semibold text-text-secondary">
                      Internal notes
                    </p>
                  </div>
                  <div className="space-y-2">
                    {selected.notes.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-card p-3 text-xs"
                      >
                        <p className="text-text-secondary">{item.body}</p>
                        <p className="mt-1 text-[10px] text-text-tertiary">
                          {item.author.name || "ARKO teammate"} ·{" "}
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (note.trim())
                        addNote.mutate({
                          messageId: selected.id,
                          body: note.trim(),
                        });
                    }}
                  >
                    <input
                      className={fieldClass}
                      placeholder="Add an internal note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                    <Button size="sm" type="submit">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      className={fieldClass}
                      value={selected.assignedToId ?? ""}
                      onChange={(event) =>
                        update.mutate({
                          id: selected.id,
                          assignedToId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {lookups.data?.users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" asChild>
                      <a
                        href={`mailto:${encodeURIComponent(selected.senderEmail)}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                      >
                        Reply by email
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
