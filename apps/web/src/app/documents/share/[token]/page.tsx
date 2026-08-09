"use client";

import { use } from "react";
import { FileText, Loader2, Printer } from "lucide-react";
import DocumentSheet from "../../../../components/documents/DocumentSheet";
import { parseDocumentContent } from "../../../../lib/documents/schema";
import { api } from "../../../../lib/trpc/client";

export default function DocumentSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const {
    data: document,
    isLoading,
    error,
  } = api.documents.publicGet.useQuery({ token }, { retry: false });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ecece4] text-sm text-neutral-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading client document
      </main>
    );
  }

  if (error || !document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ecece4] p-6 text-neutral-900">
        <div className="max-w-md border-2 border-neutral-900 bg-white p-8 text-center">
          <FileText className="mx-auto h-9 w-9" />
          <h1 className="mt-4 text-xl font-bold">Document unavailable</h1>
          <p className="mt-2 text-sm text-neutral-600">
            This link may have been replaced, archived, unpublished, or entered
            incorrectly. Ask the sender for a current link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ecece4] px-3 py-8 text-neutral-900 sm:px-6">
      <div className="print:hidden mx-auto mb-4 flex max-w-[210mm] flex-col gap-3 border-2 border-neutral-900 bg-[#b8ff2e] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
            Published client document
          </div>
          <p className="mt-1 text-sm font-semibold">
            Use your browser’s print dialog and choose “Save as PDF”.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 border-2 border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 focus:ring-offset-[#b8ff2e]"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>
      <div className="print-document-root">
        <DocumentSheet
          type={document.type}
          title={document.title}
          invoiceNumber={document.invoiceNumber}
          issueDate={document.issueDate}
          dueDate={document.dueDate}
          projectName={document.project?.name}
          content={parseDocumentContent(document.content)}
          lineItems={document.lineItems}
        />
      </div>
    </main>
  );
}
