"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Button, Card } from "@arko/ui";
import {
  Copy,
  Edit3,
  FileCheck,
  FileText,
  Loader2,
  Plus,
  Printer,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import DocumentSheet from "../../../components/documents/DocumentSheet";
import {
  formatDocumentAmount,
  parseDocumentContent,
  validateDocumentForPublish,
  type DocumentContent,
  type DocumentLineItem,
  type DocumentType,
} from "../../../lib/documents/schema";
import { api } from "../../../lib/trpc/client";

type DocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function fromDateInput(value: string) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

export default function DocumentsPage() {
  const utils = api.useUtils();
  const [typeFilter, setTypeFilter] = useState<DocumentType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "ALL">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [newType, setNewType] = useState<DocumentType>("INVOICE");
  const [newTitle, setNewTitle] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<DocumentStatus>("DRAFT");
  const [editIssueDate, setEditIssueDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editContent, setEditContent] = useState<DocumentContent>({});
  const [editLineItems, setEditLineItems] = useState<DocumentLineItem[]>([]);

  const { data: projects = [] } = api.clientPortal.dashboard.useQuery();
  const {
    data: documents = [],
    isLoading,
    error: listError,
  } = api.documents.list.useQuery({
    type: typeFilter === "ALL" ? undefined : typeFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search.trim() || undefined,
  });
  const { data: detail, isLoading: detailLoading } = api.documents.get.useQuery(
    { id: viewingId! },
    { enabled: Boolean(viewingId) },
  );

  useEffect(() => {
    if (!detail) return;
    setEditTitle(detail.title);
    setEditStatus(detail.status);
    setEditIssueDate(toDateInput(detail.issueDate));
    setEditDueDate(toDateInput(detail.dueDate));
    setEditContent(parseDocumentContent(detail.content));
    setEditLineItems(
      detail.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: item.sortOrder,
      })),
    );
    setFormErrors([]);
  }, [detail]);

  const createDocument = api.documents.create.useMutation({
    onSuccess: (document) => {
      void utils.documents.list.invalidate();
      setNewOpen(false);
      setProjectId("");
      setNewTitle("");
      setViewingId(document.id);
    },
  });
  const updateDocument = api.documents.update.useMutation({
    onSuccess: () => {
      void utils.documents.list.invalidate();
      if (viewingId) void utils.documents.get.invalidate({ id: viewingId });
      setFormErrors([]);
    },
    onError: (error) => setFormErrors([error.message]),
  });
  const deleteDocument = api.documents.delete.useMutation({
    onSuccess: () => {
      void utils.documents.list.invalidate();
      closeDetail();
    },
  });
  const rotateShareToken = api.documents.generateShareToken.useMutation({
    onSuccess: () => {
      if (viewingId) void utils.documents.get.invalidate({ id: viewingId });
      setCopied(false);
    },
  });

  function closeDetail() {
    setViewingId(null);
    setEditTitle("");
    setEditContent({});
    setEditLineItems([]);
    setFormErrors([]);
  }

  function saveDocument() {
    if (!detail) return;
    const errors =
      editStatus === "PUBLISHED"
        ? validateDocumentForPublish({
            type: detail.type,
            title: editTitle,
            content: editContent,
            lineItems: editLineItems,
            issueDate: fromDateInput(editIssueDate),
            dueDate: fromDateInput(editDueDate),
          })
        : [];
    setFormErrors(errors);
    if (errors.length > 0) return;

    updateDocument.mutate({
      id: detail.id,
      title: editTitle.trim(),
      status: editStatus,
      issueDate: fromDateInput(editIssueDate),
      dueDate: fromDateInput(editDueDate),
      content: editContent,
      lineItems: editLineItems.map((item, sortOrder) => ({
        ...item,
        sortOrder,
      })),
    });
  }

  async function copyShareUrl(token?: string | null) {
    if (!token) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/documents/share/${token}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const metrics = {
    total: documents.length,
    published: documents.filter((document) => document.status === "PUBLISHED")
      .length,
    invoices: documents.filter((document) => document.type === "INVOICE")
      .length,
    timelines: documents.filter((document) => document.type === "TIMELINE")
      .length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <FileCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">
              Client handoff
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Documents and invoices
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate editable project boilerplates, publish a private client
            link, and print a clean A4 PDF.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New document
        </Button>
      </header>

      <section
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        aria-label="Document metrics"
      >
        {[
          ["All documents", metrics.total],
          ["Published", metrics.published],
          ["Invoices", metrics.invoices],
          ["Timelines", metrics.timelines],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          </Card>
        ))}
      </section>

      <section
        className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between"
        aria-label="Document filters"
      >
        <div className="flex gap-1 overflow-x-auto">
          {(
            ["ALL", "INVOICE", "AGREEMENT", "PROPOSAL", "TIMELINE"] as const
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${typeFilter === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {type === "ALL" ? "All types" : type}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 lg:w-64">
            <span className="sr-only">Search documents</span>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents"
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-xs"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as DocumentStatus | "ALL")
            }
            aria-label="Filter by status"
            className="rounded-md border bg-background px-3 text-xs"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center p-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading documents
        </div>
      ) : listError ? (
        <Card className="border-destructive/40 p-8 text-center text-sm text-destructive">
          Could not load documents: {listError.message}
        </Card>
      ) : documents.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No matching documents</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create one from an existing client project.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => {
            const content = parseDocumentContent(document.content);
            const total = document.lineItems.reduce(
              (sum, item) => sum + item.quantity * item.unitPrice,
              0,
            );
            return (
              <button
                key={document.id}
                type="button"
                onClick={() => setViewingId(document.id)}
                className="text-left"
              >
                <Card className="flex h-full flex-col justify-between p-5 transition-colors hover:border-primary/50">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-primary">{document.type}</span>
                      <span className="text-muted-foreground">
                        {document.status}
                      </span>
                    </div>
                    <h2 className="mt-4 text-base font-semibold">
                      {document.title}
                    </h2>
                    {document.invoiceNumber && (
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {document.invoiceNumber}
                      </div>
                    )}
                    <div className="mt-4 text-xs text-muted-foreground">
                      {document.project?.name || "Project not linked"}
                    </div>
                  </div>
                  <div className="mt-6 flex items-end justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      {document.lineItems.length > 0
                        ? formatDocumentAmount(total, content.currency)
                        : `Updated ${new Date(document.updatedAt).toLocaleDateString()}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Edit3 className="h-3.5 w-3.5" />
                      Open
                    </span>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {newOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setNewOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-document-title"
            className="w-full max-w-lg space-y-5 rounded-xl border bg-background p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <h2 id="new-document-title" className="text-lg font-bold">
                  Create a boilerplate
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Project data is inserted where available. Missing business
                  details stay clearly marked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-xs font-semibold">
              Client project
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="mt-2 w-full rounded-md border bg-background p-2"
              >
                <option value="">Choose a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} —{" "}
                    {project.client?.name || project.client?.email}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="text-xs font-semibold">Document type</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  ["INVOICE", "AGREEMENT", "PROPOSAL", "TIMELINE"] as const
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className={`border p-3 text-left text-xs font-semibold ${newType === type ? "border-primary bg-primary/10 text-primary" : "rounded-md"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-xs font-semibold">
              Custom title{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                className="mt-2 w-full rounded-md border bg-background p-2"
              />
            </label>
            {createDocument.error && (
              <p className="text-xs text-destructive">
                {createDocument.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!projectId || createDocument.isPending}
                onClick={() =>
                  createDocument.mutate({
                    projectId,
                    type: newType,
                    title: newTitle.trim() || undefined,
                  })
                }
              >
                {createDocument.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3 md:p-8">
          {detailLoading || !detail ? (
            <div className="flex min-h-full items-center justify-center text-white">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading document
            </div>
          ) : (
            <div className="mx-auto grid max-w-[96rem] gap-5 lg:h-[calc(100vh-4rem)] lg:grid-cols-2 lg:overflow-hidden">
              <div className="print:hidden rounded-xl border bg-background p-5 shadow-2xl lg:overflow-y-auto">
                <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      {detail.type} / {detail.status}
                    </div>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      disabled={detail.status === "ARCHIVED"}
                      aria-label="Document title"
                      className="mt-2 w-full border-b bg-transparent py-1 text-xl font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print / Save PDF
                    </Button>
                    {detail.status === "PUBLISHED" && detail.shareToken && (
                      <Button
                        variant="outline"
                        onClick={() => void copyShareUrl(detail.shareToken)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copied ? "Copied" : "Copy client link"}
                      </Button>
                    )}
                    {detail.status === "PUBLISHED" && (
                      <Button
                        variant="outline"
                        disabled={rotateShareToken.isPending}
                        onClick={() =>
                          rotateShareToken.mutate({ id: detail.id })
                        }
                        title="Invalidates the previous client link"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Rotate link
                      </Button>
                    )}
                    <Button variant="outline" onClick={closeDetail}>
                      <X className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Document details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs">
                        Issue date
                        <input
                          type="date"
                          value={editIssueDate}
                          onChange={(event) =>
                            setEditIssueDate(event.target.value)
                          }
                          disabled={detail.status === "ARCHIVED"}
                          className="mt-1 w-full rounded border bg-background p-2"
                        />
                      </label>
                      <label className="text-xs">
                        Due / target date
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(event) =>
                            setEditDueDate(event.target.value)
                          }
                          disabled={detail.status === "ARCHIVED"}
                          className="mt-1 w-full rounded border bg-background p-2"
                        />
                      </label>
                    </div>
                    {(detail.type === "INVOICE" ||
                      detail.type === "PROPOSAL") && (
                      <label className="block text-xs">
                        Currency (ISO code)
                        <input
                          value={editContent.currency || ""}
                          maxLength={3}
                          placeholder="PHP"
                          onChange={(event) =>
                            setEditContent((content) => ({
                              ...content,
                              currency: event.target.value.toUpperCase(),
                            }))
                          }
                          disabled={detail.status === "ARCHIVED"}
                          className="mt-1 w-full rounded border bg-background p-2 uppercase"
                        />
                      </label>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <PartyEditor
                        label="Provider"
                        party={editContent.from}
                        disabled={detail.status === "ARCHIVED"}
                        onChange={(from) =>
                          setEditContent((content) => ({ ...content, from }))
                        }
                      />
                      <PartyEditor
                        label="Client"
                        party={editContent.billTo}
                        disabled={detail.status === "ARCHIVED"}
                        onChange={(billTo) =>
                          setEditContent((content) => ({ ...content, billTo }))
                        }
                      />
                    </div>
                    <label className="block text-xs">
                      Summary
                      <textarea
                        rows={4}
                        value={editContent.summary || ""}
                        onChange={(event) =>
                          setEditContent((content) => ({
                            ...content,
                            summary: event.target.value,
                          }))
                        }
                        disabled={detail.status === "ARCHIVED"}
                        className="mt-1 w-full rounded border bg-background p-2"
                      />
                    </label>
                    {detail.type === "AGREEMENT" && (
                      <label className="block text-xs">
                        Legal review notice
                        <textarea
                          rows={3}
                          value={editContent.legalNotice || ""}
                          onChange={(event) =>
                            setEditContent((content) => ({
                              ...content,
                              legalNotice: event.target.value,
                            }))
                          }
                          disabled={detail.status === "ARCHIVED"}
                          className="mt-1 w-full rounded border bg-background p-2"
                        />
                      </label>
                    )}
                    <label className="block text-xs">
                      Terms, assumptions, and instructions
                      <textarea
                        rows={4}
                        value={editContent.terms || ""}
                        onChange={(event) =>
                          setEditContent((content) => ({
                            ...content,
                            terms: event.target.value,
                          }))
                        }
                        disabled={detail.status === "ARCHIVED"}
                        className="mt-1 w-full rounded border bg-background p-2"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Editable boilerplate
                    </h3>
                    {editContent.sections?.map((section, index) => (
                      <div key={index} className="rounded border p-3">
                        <input
                          aria-label={`Section ${index + 1} title`}
                          value={section.title}
                          onChange={(event) =>
                            setEditContent((content) => ({
                              ...content,
                              sections: content.sections?.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, title: event.target.value }
                                    : item,
                              ),
                            }))
                          }
                          disabled={detail.status === "ARCHIVED"}
                          className="w-full border-b bg-transparent pb-1 text-xs font-semibold"
                        />
                        <textarea
                          aria-label={`${section.title} content`}
                          rows={4}
                          value={section.body}
                          onChange={(event) =>
                            setEditContent((content) => ({
                              ...content,
                              sections: content.sections?.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, body: event.target.value }
                                    : item,
                              ),
                            }))
                          }
                          disabled={detail.status === "ARCHIVED"}
                          className="mt-2 w-full resize-y bg-transparent text-xs"
                        />
                      </div>
                    ))}
                    {detail.type === "TIMELINE" && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          disabled={detail.status === "ARCHIVED"}
                          onClick={() =>
                            setEditContent((content) => ({
                              ...content,
                              timelineEvents: [
                                ...(content.timelineEvents || []),
                                {
                                  title: "",
                                  date: null,
                                  status: "NOT_STARTED",
                                  description: "",
                                  dependency: "",
                                  approval: "",
                                },
                              ],
                            }))
                          }
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add milestone
                        </Button>
                      </div>
                    )}
                    {detail.type === "TIMELINE" &&
                      editContent.timelineEvents?.map((event, index) => (
                        <div
                          key={index}
                          className="relative grid gap-2 rounded border p-3 sm:grid-cols-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setEditContent((content) => ({
                                ...content,
                                timelineEvents: content.timelineEvents?.filter(
                                  (_, eventIndex) => eventIndex !== index,
                                ),
                              }))
                            }
                            disabled={detail.status === "ARCHIVED"}
                            aria-label={`Remove milestone ${index + 1}`}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <input
                            aria-label={`Milestone ${index + 1} title`}
                            value={event.title}
                            onChange={(change) =>
                              updateTimelineEvent(
                                index,
                                { title: change.target.value },
                                setEditContent,
                              )
                            }
                            disabled={detail.status === "ARCHIVED"}
                            className="rounded border bg-background p-2 text-xs"
                          />
                          <input
                            type="date"
                            aria-label={`${event.title} date`}
                            value={event.date || ""}
                            onChange={(change) =>
                              updateTimelineEvent(
                                index,
                                { date: change.target.value },
                                setEditContent,
                              )
                            }
                            disabled={detail.status === "ARCHIVED"}
                            className="rounded border bg-background p-2 text-xs"
                          />
                          <input
                            aria-label={`${event.title} status`}
                            value={event.status}
                            onChange={(change) =>
                              updateTimelineEvent(
                                index,
                                { status: change.target.value },
                                setEditContent,
                              )
                            }
                            disabled={detail.status === "ARCHIVED"}
                            className="rounded border bg-background p-2 text-xs"
                          />
                          <input
                            aria-label={`${event.title} dependency`}
                            placeholder="Dependency"
                            value={event.dependency || ""}
                            onChange={(change) =>
                              updateTimelineEvent(
                                index,
                                { dependency: change.target.value },
                                setEditContent,
                              )
                            }
                            disabled={detail.status === "ARCHIVED"}
                            className="rounded border bg-background p-2 text-xs"
                          />
                          <textarea
                            aria-label={`${event.title} description`}
                            placeholder="Description"
                            value={event.description || ""}
                            onChange={(change) =>
                              updateTimelineEvent(
                                index,
                                { description: change.target.value },
                                setEditContent,
                              )
                            }
                            disabled={detail.status === "ARCHIVED"}
                            className="rounded border bg-background p-2 text-xs"
                          />
                          <textarea
                            aria-label={`${event.title} approval`}
                            placeholder="Approval / sign-off"
                            value={event.approval || ""}
                            onChange={(change) =>
                              updateTimelineEvent(
                                index,
                                { approval: change.target.value },
                                setEditContent,
                              )
                            }
                            disabled={detail.status === "ARCHIVED"}
                            className="rounded border bg-background p-2 text-xs"
                          />
                        </div>
                      ))}
                  </div>
                </div>

                {(detail.type === "INVOICE" || detail.type === "PROPOSAL") && (
                  <div className="mt-6 border-t pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Line items
                      </h3>
                      <Button
                        variant="outline"
                        disabled={detail.status === "ARCHIVED"}
                        onClick={() =>
                          setEditLineItems((items) => [
                            ...items,
                            {
                              description: "",
                              quantity: 1,
                              unitPrice: 0,
                              sortOrder: items.length,
                            },
                          ])
                        }
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editLineItems.map((item, index) => (
                        <LineItemEditor
                          key={index}
                          item={item}
                          index={index}
                          disabled={detail.status === "ARCHIVED"}
                          onChange={(next) =>
                            setEditLineItems((items) =>
                              items.map((current, itemIndex) =>
                                itemIndex === index ? next : current,
                              ),
                            )
                          }
                          onRemove={() =>
                            setEditLineItems((items) =>
                              items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {formErrors.length > 0 && (
                  <div
                    role="alert"
                    className="mt-5 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    <strong>Before publishing:</strong>
                    <ul className="mt-1 list-disc pl-5">
                      {formErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {detail.status === "DRAFT" && (
                      <Button
                        variant="outline"
                        className="text-destructive"
                        disabled={deleteDocument.isPending}
                        onClick={() => {
                          if (window.confirm("Delete this draft document?"))
                            deleteDocument.mutate({ id: detail.id });
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete draft
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs">
                      Status{" "}
                      <select
                        value={editStatus}
                        disabled={detail.status === "ARCHIVED"}
                        onChange={(event) =>
                          setEditStatus(event.target.value as DocumentStatus)
                        }
                        className="ml-2 rounded border bg-background px-2 py-2"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </label>
                    <Button
                      disabled={
                        detail.status === "ARCHIVED" || updateDocument.isPending
                      }
                      onClick={saveDocument}
                    >
                      {updateDocument.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save changes
                    </Button>
                  </div>
                </div>
              </div>

              <div className="print-document-root lg:overflow-y-auto lg:pr-2">
                <DocumentSheet
                  type={detail.type}
                  title={editTitle}
                  invoiceNumber={detail.invoiceNumber}
                  issueDate={fromDateInput(editIssueDate)}
                  dueDate={fromDateInput(editDueDate)}
                  projectName={detail.project?.name}
                  content={editContent}
                  lineItems={editLineItems}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PartyEditor({
  label,
  party = {},
  disabled,
  onChange,
}: {
  label: string;
  party?: DocumentContent["from"];
  disabled: boolean;
  onChange: (party: NonNullable<DocumentContent["from"]>) => void;
}) {
  return (
    <fieldset className="space-y-2 rounded border p-3">
      <legend className="px-1 text-xs font-semibold">{label}</legend>
      <input
        aria-label={`${label} name`}
        placeholder="Name"
        value={party.name || ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...party, name: event.target.value })}
        className="w-full rounded border bg-background p-2 text-xs"
      />
      <input
        aria-label={`${label} email`}
        type="email"
        placeholder="Email"
        value={party.email || ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...party, email: event.target.value })}
        className="w-full rounded border bg-background p-2 text-xs"
      />
      <textarea
        aria-label={`${label} address`}
        placeholder="Address"
        value={party.address || ""}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...party, address: event.target.value })
        }
        className="w-full rounded border bg-background p-2 text-xs"
      />
    </fieldset>
  );
}

function LineItemEditor({
  item,
  index,
  disabled,
  onChange,
  onRemove,
}: {
  item: DocumentLineItem;
  index: number;
  disabled: boolean;
  onChange: (item: DocumentLineItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_5rem_2rem] gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_2rem]">
      <input
        aria-label={`Line item ${index + 1} description`}
        placeholder="Description"
        value={item.description}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...item, description: event.target.value })
        }
        className="min-w-0 rounded border bg-background p-2 text-xs"
      />
      <input
        aria-label={`Line item ${index + 1} quantity`}
        type="number"
        min="0.01"
        step="0.01"
        value={item.quantity}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...item, quantity: Number(event.target.value) })
        }
        className="rounded border bg-background p-2 text-xs"
      />
      <input
        aria-label={`Line item ${index + 1} price`}
        type="number"
        min="0"
        step="0.01"
        value={item.unitPrice}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...item, unitPrice: Number(event.target.value) })
        }
        className="col-span-2 rounded border bg-background p-2 text-xs sm:col-span-1"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove line item ${index + 1}`}
        className="col-start-3 row-start-1 text-muted-foreground hover:text-destructive sm:col-start-auto sm:row-start-auto"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function updateTimelineEvent(
  index: number,
  patch: Partial<NonNullable<DocumentContent["timelineEvents"]>[number]>,
  setContent: Dispatch<SetStateAction<DocumentContent>>,
) {
  setContent((content) => ({
    ...content,
    timelineEvents: content.timelineEvents?.map((event, eventIndex) =>
      eventIndex === index ? { ...event, ...patch } : event,
    ),
  }));
}
