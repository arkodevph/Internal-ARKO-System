"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { api } from "../../../lib/trpc/client";

export function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { data: items, isLoading } = api.notifications.list.useQuery(
    undefined,
    {
      enabled: open,
      refetchInterval: open ? 15000 : false,
    },
  );
  const utils = api.useUtils();
  const invalidate = () => {
    utils.notifications.list.invalidate();
    utils.notifications.unreadCount.invalidate();
  };
  const markRead = api.notifications.markRead.useMutation({
    onSuccess: invalidate,
  });
  const markAllRead = api.notifications.markAllRead.useMutation({
    onSuccess: invalidate,
  });
  const del = api.notifications.delete.useMutation({ onSuccess: invalidate });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close notifications"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={{ x: reduceMotion ? 0 : "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduceMotion ? 0 : "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-border-subtle bg-bg-sidebar shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border-subtle p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary-400">
                  Connected activity
                </p>
                <h2 className="mt-1 text-xl font-semibold">Notifications</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close notifications"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
              <p className="text-xs text-text-tertiary">
                Updates from work connected to you
              </p>
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-primary-400"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-2xl bg-card"
                    />
                  ))}
                </div>
              ) : !items?.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400">
                    <Bell className="h-6 w-6" />
                  </span>
                  <p className="mt-4 font-semibold">
                    You&apos;re all caught up
                  </p>
                  <p className="mt-1 text-sm text-text-tertiary">
                    New project activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-4 ${item.read ? "border-border-subtle bg-card/50" : "border-primary-500/25 bg-primary-500/10"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-text-tertiary/40" : "bg-primary-400"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{item.title}</p>
                          {item.message && (
                            <p className="mt-1 text-xs leading-5 text-text-secondary">
                              {item.message}
                            </p>
                          )}
                        </div>
                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => markRead.mutate({ id: item.id })}
                            aria-label="Mark notification read"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-text-tertiary hover:bg-primary-500/10 hover:text-primary-400"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => del.mutate({ id: item.id })}
                          aria-label="Delete notification"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-text-tertiary hover:bg-neg-bg hover:text-neg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
