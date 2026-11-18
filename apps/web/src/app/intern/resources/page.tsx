"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  Paperclip,
  Search,
} from "lucide-react";
import { api } from "../../../lib/trpc/client";
import {
  Empty,
  PageHeading,
  Pagination,
  QueryState,
  safeWebUrl,
} from "../_components/common";
import s from "../_components/intern.module.css";

function ResourceFiles({ resourceId }: { resourceId: string }) {
  const files = api.intern.attachments.useQuery({ resourceId });
  const utils = api.useUtils();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function download(id: string) {
    setError("");
    setDownloading(id);
    // Open during the click so browsers don't block an async popup.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const result = await utils.intern.download.fetch({ id });
      if (tab) tab.location.href = result.url;
      else window.location.assign(result.url);
    } catch {
      tab?.close();
      setError(
        "The download is unavailable. Try again or ask your team to check this file.",
      );
    } finally {
      setDownloading(null);
    }
  }
  return (
    <div className={s.files}>
      <QueryState
        loading={files.isLoading}
        error={files.error}
        retry={files.refetch}
      />
      {files.data?.length === 0 && (
        <p className={s.feedback}>
          No shared files on this resource.
        </p>
      )}
      {files.data?.map((file) => (
        <button
          key={file.id}
          type="button"
          disabled={!!downloading}
          onClick={() => download(file.id)}
        >
          <Download size={16} />
          <span>
            {downloading === file.id ? "Preparing download…" : file.fileName}
          </span>
        </button>
      ))}
      {error && (
        <p role="alert" className={s.feedback}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function InternResources() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const query = api.intern.resources.useQuery({
    page,
    search,
    categoryId: category || undefined,
  });
  return (
    <>
      <PageHeading title="Resources">
        Your team’s shared guides, useful tools and project references, all in
        one library.
      </PageHeading>
      <div className={s.toolbar}>
        <div className={s.search}>
          <Search size={18} />
          <input
            className={s.input}
            aria-label="Search resources"
            placeholder="Find a guide, tool or reference…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className={s.input}
          aria-label="Resource category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {query.data?.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={query.refetch}
      />
      {query.data &&
        (query.data.items.length ? (
          <div className={s.resourceGrid}>
            {query.data.items.map((resource) => {
              const url = safeWebUrl(resource.url);
              return (
                <article
                  className={`${s.panel} ${s.resourceCard}`}
                  key={resource.id}
                >
                  <div className={s.resourceIcon}>
                    <BookOpen size={24} />
                    <span>{resource.category?.name || "General"}</span>
                  </div>
                  <h2>{resource.title}</h2>
                  <p>
                    {resource.description ||
                      "A reference shared by your ARKO team."}
                  </p>
                  <div className={s.actions}>
                    {url && (
                      <a
                        className={`${s.button} ${s.primary}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open resource <ArrowUpRight size={16} />
                      </a>
                    )}
                    <button
                      type="button"
                      className={s.button}
                      aria-expanded={open.has(resource.id)}
                      onClick={() =>
                        setOpen((previous) => {
                          const next = new Set(previous);
                          if (next.has(resource.id)) next.delete(resource.id);
                          else next.add(resource.id);
                          return next;
                        })
                      }
                    >
                      <Paperclip size={16} />
                      Files
                    </button>
                  </div>
                  {open.has(resource.id) && (
                    <ResourceFiles resourceId={resource.id} />
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <section className={s.panel}>
            <Empty
              title={
                search || category
                  ? "No resources match"
                  : "Your library is getting started"
              }
            >
              {search || category
                ? "Try a different search or choose All categories."
                : "Your team can share guides, tools and references from Resources in the main system."}
            </Empty>
          </section>
        ))}
      <Pagination
        page={page}
        pages={query.data?.pages || 1}
        onChange={setPage}
      />
    </>
  );
}
