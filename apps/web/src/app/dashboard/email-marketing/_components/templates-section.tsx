"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import {
  Archive,
  Copy,
  Eye,
  FileCode2,
  Loader2,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { toast } from "../../../../components/toaster";
import {
  EmptyState,
  Field,
  fieldClass,
  formatDate,
  StatusBadge,
} from "./shared";

const defaults = {
  name: "",
  description: "",
  subject: "",
  previewText: "",
  htmlBody:
    '<div style="font-family:Arial,sans-serif;padding:24px"><h1>Hello {{first_name}},</h1><p>Write your message here.</p></div>',
  textBody: "Hello {{first_name}},\n\nWrite your message here.",
};

export function TemplatesSection() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [testAddress, setTestAddress] = useState("");
  const templates = api.emailMarketing.templates.list.useQuery();
  const utils = api.useUtils();
  const invalidate = () =>
    Promise.all([
      templates.refetch(),
      utils.emailMarketing.lookups.invalidate(),
      utils.emailMarketing.overview.invalidate(),
    ]);
  const create = api.emailMarketing.templates.create.useMutation({
    onSuccess: async () => {
      await invalidate();
      setForm(defaults);
      setEditingId(null);
      setShowForm(false);
      toast("Template created");
    },
  });
  const update = api.emailMarketing.templates.update.useMutation({
    onSuccess: async () => {
      await invalidate();
      setForm(defaults);
      setEditingId(null);
      setShowForm(false);
      toast("Template updated");
    },
  });
  const duplicate = api.emailMarketing.templates.duplicate.useMutation({
    onSuccess: async () => {
      await invalidate();
      toast("Template duplicated");
    },
  });
  const archive = api.emailMarketing.templates.archive.useMutation({
    onSuccess: invalidate,
  });
  const testSend = api.emailMarketing.templates.testSend.useMutation({
    onSuccess: () => toast("Test email sent"),
  });
  const preview = templates.data?.find((template) => template.id === previewId);
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaults);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Email templates
          </h2>
          <p className="text-xs text-text-tertiary">
            Reusable content with personalization variables.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
        >
          <Plus className="h-3.5 w-3.5" /> Template
        </Button>
      </div>

      {showForm && (
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle className="text-sm">
              {editingId ? "Edit template" : "New template"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (editingId) update.mutate({ id: editingId, ...form });
                else create.mutate(form);
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Template name">
                  <input
                    required
                    className={fieldClass}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Internal description">
                  <input
                    className={fieldClass}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                  />
                </Field>
                <Field label="Subject">
                  <input
                    required
                    className={fieldClass}
                    value={form.subject}
                    onChange={(event) =>
                      setForm({ ...form, subject: event.target.value })
                    }
                  />
                </Field>
                <Field label="Preview text">
                  <input
                    className={fieldClass}
                    value={form.previewText}
                    onChange={(event) =>
                      setForm({ ...form, previewText: event.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                <Field label="HTML content">
                  <textarea
                    required
                    className={`${fieldClass} min-h-64 font-mono text-xs`}
                    value={form.htmlBody}
                    onChange={(event) =>
                      setForm({ ...form, htmlBody: event.target.value })
                    }
                  />
                </Field>
                <Field label="Plain-text fallback">
                  <textarea
                    className={`${fieldClass} min-h-64 font-mono text-xs`}
                    value={form.textBody}
                    onChange={(event) =>
                      setForm({ ...form, textBody: event.target.value })
                    }
                  />
                </Field>
              </div>
              <p className="text-xs text-text-tertiary">
                Variables: {"{{first_name}}"}, {"{{last_name}}"},{" "}
                {"{{full_name}}"}, {"{{company}}"}, and {"{{email}}"}.
              </p>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={create.isPending || update.isPending}
                >
                  {(create.isPending || update.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}{" "}
                  {editingId ? "Update template" : "Save template"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeForm}
                >
                  Cancel
                </Button>
              </div>
              {create.error && (
                <p className="text-xs text-red-500">{create.error.message}</p>
              )}
              {update.error && (
                <p className="text-xs text-red-500">{update.error.message}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {!templates.data?.length ? (
        <EmptyState
          title="No email templates"
          detail="Create a reusable template before building a campaign."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {templates.data.map((template) => (
            <Card key={template.id} className="hover:translate-y-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary-500/10 p-2 text-primary-500">
                    <FileCode2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {template.name}
                      </p>
                      <StatusBadge value={template.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-text-secondary">
                      {template.subject}
                    </p>
                    <p className="mt-2 text-[11px] text-text-tertiary">
                      Used by {template._count.campaigns} campaigns ·{" "}
                      {formatDate(template.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-1 border-t border-border-subtle pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewId(template.id)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(template.id);
                      setForm({
                        name: template.name,
                        description: template.description ?? "",
                        subject: template.subject,
                        previewText: template.previewText ?? "",
                        htmlBody: template.htmlBody,
                        textBody: template.textBody ?? "",
                      });
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicate.mutate({ id: template.id })}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {template.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        confirm("Archive this template?") &&
                        archive.mutate({ id: template.id })
                      }
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <Card className="hover:translate-y-0">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm">Preview: {preview.name}</CardTitle>
              <p className="mt-1 text-xs text-text-tertiary">
                {preview.subject}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewId(null)}
            >
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <iframe
                title={`Preview ${preview.name}`}
                sandbox=""
                srcDoc={preview.htmlBody}
                className="h-[520px] w-full rounded-xl border border-border-subtle bg-white"
              />
              <div className="space-y-3">
                <Field label="Send test to">
                  <input
                    type="email"
                    className={fieldClass}
                    value={testAddress}
                    onChange={(event) => setTestAddress(event.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <Button
                  className="w-full"
                  disabled={!testAddress || testSend.isPending}
                  onClick={() =>
                    testSend.mutate({ id: preview.id, to: testAddress })
                  }
                >
                  {testSend.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}{" "}
                  Send test
                </Button>
                {testSend.error && (
                  <p className="text-xs text-red-500">
                    {testSend.error.message}
                  </p>
                )}
                <div className="rounded-lg bg-card p-3 text-xs text-text-tertiary">
                  <p className="font-medium text-text-secondary">
                    Plain-text fallback
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap font-sans">
                    {preview.textBody || "Not provided"}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
