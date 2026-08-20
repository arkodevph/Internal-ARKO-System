"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import {
  Archive,
  Download,
  Loader2,
  Plus,
  Search,
  Tags,
  Upload,
  UsersRound,
} from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { toast } from "../../../../components/toaster";
import { EmptyState, Field, fieldClass, StatusBadge } from "./shared";

type AudienceView = "contacts" | "tags" | "segments" | "sources" | "import";

const contactDefaults = {
  email: "",
  firstName: "",
  lastName: "",
  company: "",
  phone: "",
  status: "SUBSCRIBED" as const,
  consentSource: "Manual entry",
  tagIds: [] as string[],
  segmentIds: [] as string[],
};

export function AudienceSection({ isAdmin }: { isAdmin: boolean }) {
  const [view, setView] = useState<AudienceView>("contacts");
  const [search, setSearch] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [contact, setContact] = useState(contactDefaults);
  const [tagName, setTagName] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceEmail, setSourceEmail] = useState("");
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importName, setImportName] = useState("");
  const [conflict, setConflict] = useState<"SKIP" | "UPDATE" | "MERGE">("SKIP");

  const utils = api.useUtils();
  const contacts = api.emailMarketing.contacts.list.useQuery({
    search,
    page: 1,
    pageSize: 100,
  });
  const tags = api.emailMarketing.tags.list.useQuery();
  const segments = api.emailMarketing.segments.list.useQuery();
  const sources = api.emailMarketing.sources.list.useQuery();
  const exportQuery = api.emailMarketing.contacts.export.useQuery(undefined, {
    enabled: false,
  });

  const invalidate = () =>
    Promise.all([
      utils.emailMarketing.contacts.list.invalidate(),
      utils.emailMarketing.overview.invalidate(),
      utils.emailMarketing.lookups.invalidate(),
    ]);
  const createContact = api.emailMarketing.contacts.create.useMutation({
    onSuccess: async () => {
      await invalidate();
      setContact(contactDefaults);
      setShowContactForm(false);
      toast("Contact added");
    },
  });
  const archiveContact = api.emailMarketing.contacts.archive.useMutation({
    onSuccess: invalidate,
  });
  const createTag = api.emailMarketing.tags.create.useMutation({
    onSuccess: async () => {
      await tags.refetch();
      await utils.emailMarketing.lookups.invalidate();
      setTagName("");
      toast("Tag created");
    },
  });
  const createSegment = api.emailMarketing.segments.create.useMutation({
    onSuccess: async () => {
      await segments.refetch();
      await utils.emailMarketing.lookups.invalidate();
      setSegmentName("");
      toast("Segment created");
    },
  });
  const createSource = api.emailMarketing.sources.create.useMutation({
    onSuccess: async () => {
      await sources.refetch();
      setSourceName("");
      setSourceEmail("");
      toast("Source created");
    },
  });
  const importContacts = api.emailMarketing.contacts.import.useMutation({
    onSuccess: async (result) => {
      await invalidate();
      setImportRows([]);
      setImportName("");
      toast(
        `Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );
    },
  });

  async function readImport(file: File) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), {
      type: "array",
      cellDates: true,
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    if (!sheet) throw new Error("The file has no readable worksheet");
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    const normalized = raw
      .map((row) => {
        const lower = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key.trim().toLowerCase().replaceAll(" ", "_"),
            value,
          ]),
        );
        return {
          email: String(lower.email ?? "").trim(),
          firstName:
            String(lower.first_name ?? lower.firstname ?? "").trim() || null,
          lastName:
            String(lower.last_name ?? lower.lastname ?? "").trim() || null,
          company: String(lower.company ?? "").trim() || null,
          phone: String(lower.phone ?? "").trim() || null,
          status:
            String(lower.status ?? "SUBSCRIBED").toUpperCase() ===
            "UNSUBSCRIBED"
              ? ("UNSUBSCRIBED" as const)
              : ("SUBSCRIBED" as const),
          consentSource: String(lower.consent_source ?? `Import: ${file.name}`),
        };
      })
      .filter((row) => row.email.includes("@"));
    setImportRows(normalized);
    setImportName(file.name);
  }

  async function exportCsv() {
    const response = await exportQuery.refetch();
    if (!response.data) return;
    const quote = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const lines = [
      [
        "Email",
        "First Name",
        "Last Name",
        "Company",
        "Phone",
        "Status",
        "Tags",
        "Segments",
        "Source",
      ]
        .map(quote)
        .join(","),
      ...response.data.map((row) =>
        [
          row.email,
          row.firstName,
          row.lastName,
          row.company,
          row.phone,
          row.status,
          row.tags.map((item) => item.tag.name).join("; "),
          row.segments.map((item) => item.segment.name).join("; "),
          row.source?.name,
        ]
          .map(quote)
          .join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `arko-marketing-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: AudienceView; label: string }> = [
    { id: "contacts", label: "Contacts" },
    { id: "tags", label: "Tags" },
    { id: "segments", label: "Segments" },
    { id: "sources", label: "Sources" },
    { id: "import", label: "Import" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${view === tab.id ? "bg-primary-500/10 text-primary-500" : "text-text-tertiary hover:text-text-primary"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setView("contacts");
              setShowContactForm((value) => !value);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Contact
          </Button>
        </div>
      </div>

      {showContactForm && (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-sm">Add marketing contact</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                createContact.mutate({ ...contact, consentAt: new Date() });
              }}
            >
              <Field label="Email">
                <input
                  className={fieldClass}
                  type="email"
                  required
                  value={contact.email}
                  onChange={(event) =>
                    setContact({ ...contact, email: event.target.value })
                  }
                />
              </Field>
              <Field label="First name">
                <input
                  className={fieldClass}
                  value={contact.firstName}
                  onChange={(event) =>
                    setContact({ ...contact, firstName: event.target.value })
                  }
                />
              </Field>
              <Field label="Last name">
                <input
                  className={fieldClass}
                  value={contact.lastName}
                  onChange={(event) =>
                    setContact({ ...contact, lastName: event.target.value })
                  }
                />
              </Field>
              <Field label="Company">
                <input
                  className={fieldClass}
                  value={contact.company}
                  onChange={(event) =>
                    setContact({ ...contact, company: event.target.value })
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  className={fieldClass}
                  value={contact.phone}
                  onChange={(event) =>
                    setContact({ ...contact, phone: event.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  className={fieldClass}
                  value={contact.status}
                  onChange={(event) =>
                    setContact({
                      ...contact,
                      status: event.target.value as typeof contact.status,
                    })
                  }
                >
                  <option value="SUBSCRIBED">Subscribed</option>
                  <option value="UNSUBSCRIBED">Unsubscribed</option>
                </select>
              </Field>
              <Field label="Consent source">
                <input
                  className={fieldClass}
                  required
                  value={contact.consentSource}
                  onChange={(event) =>
                    setContact({
                      ...contact,
                      consentSource: event.target.value,
                    })
                  }
                />
              </Field>
              <div className="flex items-end gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createContact.isPending}
                >
                  {createContact.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}{" "}
                  Save contact
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </Button>
              </div>
              {createContact.error && (
                <p className="text-xs text-red-500 md:col-span-2 xl:col-span-4">
                  {createContact.error.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {view === "contacts" && (
        <Card className="hover:translate-y-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm">Audience contacts</CardTitle>
            <span className="text-xs text-text-tertiary">
              {contacts.data?.total ?? 0} contacts
            </span>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
              <input
                className={`${fieldClass} pl-9`}
                placeholder="Search email, name, or company"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {!contacts.data?.items.length ? (
              <EmptyState
                title="No contacts found"
                detail="Add a contact or import an existing audience."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead className="border-b border-border-subtle text-text-tertiary">
                    <tr>
                      <th className="px-2 py-2 font-medium">Contact</th>
                      <th className="px-2 py-2 font-medium">Company</th>
                      <th className="px-2 py-2 font-medium">Tags</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Activity</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {contacts.data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-3">
                          <p className="font-medium text-text-primary">
                            {[item.firstName, item.lastName]
                              .filter(Boolean)
                              .join(" ") || item.email}
                          </p>
                          <p className="text-text-tertiary">{item.email}</p>
                        </td>
                        <td className="px-2 py-3 text-text-secondary">
                          {item.company || "-"}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map(({ tag }) => (
                              <span
                                key={tag.id}
                                className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] text-primary-500"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge value={item.status} />
                        </td>
                        <td className="px-2 py-3 text-text-tertiary">
                          {item._count.recipients} deliveries ·{" "}
                          {item._count.inboxMessages} replies
                        </td>
                        <td className="px-2 py-3 text-right">
                          {isAdmin && item.status !== "ARCHIVED" && (
                            <button
                              title="Archive"
                              onClick={() =>
                                confirm("Archive this contact?") &&
                                archiveContact.mutate({ id: item.id })
                              }
                              className="rounded-lg p-1.5 text-text-tertiary hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view === "tags" && (
        <Manager
          title="Tags"
          icon={<Tags className="h-4 w-4" />}
          value={tagName}
          setValue={setTagName}
          placeholder="Newsletter"
          pending={createTag.isPending}
          onCreate={() =>
            tagName.trim() &&
            createTag.mutate({ name: tagName.trim(), color: "#6366f1" })
          }
          items={(tags.data ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            count: item._count.contacts,
          }))}
        />
      )}
      {view === "segments" && (
        <Manager
          title="Segments"
          icon={<UsersRound className="h-4 w-4" />}
          value={segmentName}
          setValue={setSegmentName}
          placeholder="VIP customers"
          pending={createSegment.isPending}
          onCreate={() =>
            segmentName.trim() &&
            createSegment.mutate({ name: segmentName.trim(), contactIds: [] })
          }
          items={(segments.data ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            count: item._count.members,
          }))}
        />
      )}
      {view === "sources" && (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-sm">Contact sources</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                if (sourceName.trim())
                  createSource.mutate({
                    name: sourceName.trim(),
                    email: sourceEmail,
                  });
              }}
            >
              <input
                className={fieldClass}
                placeholder="Website form"
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
              />
              <input
                className={fieldClass}
                type="email"
                placeholder="Optional inbound address"
                value={sourceEmail}
                onChange={(event) => setSourceEmail(event.target.value)}
              />
              <Button type="submit" size="sm">
                Add source
              </Button>
            </form>
            <div className="grid gap-2 md:grid-cols-2">
              {sources.data?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border-subtle p-3"
                >
                  <p className="text-sm font-medium text-text-primary">
                    {item.name}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {item.email || "No inbound address"} ·{" "}
                    {item._count.contacts} contacts
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {view === "import" && (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-sm">Import contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-border-subtle p-8 text-center hover:border-primary-500/40">
              <Upload className="mb-2 h-6 w-6 text-primary-500" />
              <span className="text-sm font-medium text-text-primary">
                Choose CSV or XLSX
              </span>
              <span className="text-xs text-text-tertiary">
                Expected columns include email, first_name, last_name, company,
                and phone.
              </span>
              <input
                className="hidden"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    readImport(file).catch((error) => toast(error.message));
                }}
              />
            </label>
            {importRows.length > 0 && (
              <div className="rounded-xl border border-border-subtle p-4">
                <p className="text-sm font-medium text-text-primary">
                  {importName}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  {importRows.length} valid email rows detected
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <Field label="Duplicate behavior">
                    <select
                      className={fieldClass}
                      value={conflict}
                      onChange={(event) =>
                        setConflict(event.target.value as typeof conflict)
                      }
                    >
                      <option value="SKIP">Skip existing</option>
                      <option value="UPDATE">Replace existing fields</option>
                      <option value="MERGE">Merge non-empty fields</option>
                    </select>
                  </Field>
                  <Button
                    disabled={importContacts.isPending}
                    onClick={() =>
                      importContacts.mutate({
                        rows: importRows,
                        onConflict: conflict,
                        tagIds: [],
                        segmentIds: [],
                      })
                    }
                  >
                    {importContacts.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}{" "}
                    Import contacts
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Manager({
  title,
  icon,
  value,
  setValue,
  placeholder,
  pending,
  onCreate,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  pending: boolean;
  onCreate: () => void;
  items: Array<{ id: string; name: string; count: number }>;
}) {
  return (
    <Card className="hover:translate-y-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="mb-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <input
            className={fieldClass}
            placeholder={placeholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit" size="sm" disabled={pending}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </form>
        {items.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle p-3"
              >
                <span className="text-sm font-medium text-text-primary">
                  {item.name}
                </span>
                <span className="text-xs text-text-tertiary">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${title.toLowerCase()} yet`}
            detail={`Create one to organize your audience.`}
          />
        )}
      </CardContent>
    </Card>
  );
}
