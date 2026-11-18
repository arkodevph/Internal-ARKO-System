"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, FileText, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import { documentFileError, documentSize } from "../../../../lib/intern-documents";
import { Empty, PageHeading, Pagination, QueryState } from "../_components/common";
import s from "../_components/intern.module.css";
import c from "./documents.module.css";

type UploadItem = { file: File; state: "waiting" | "uploading" | "saved" | "error"; progress: number; error?: string };

async function responseError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error || "We couldn’t complete that action. Please try again.";
}

export default function InternDocuments() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"" | "pdf" | "docx">("");
  const [page, setPage] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const activeUpload = useRef<XMLHttpRequest | null>(null);
  const uploadLock = useRef(false);
  const mounted = useRef(true);
  const utils = api.useUtils();
  const query = api.intern.documents.useQuery({ page, search, kind: kind || undefined });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; activeUpload.current?.abort(); };
  }, []);

  async function upload(files: File[]) {
    if (!files.length || uploadLock.current) return;
    setError("");
    setNotice("");
    if (files.length > 10) { setError("Choose up to 10 documents at a time."); return; }
    uploadLock.current = true;
    setUploading(true);
    const items: UploadItem[] = files.map((file) => {
      const error = documentFileError(file.name, file.size);
      return { file, state: error ? "error" : "waiting", progress: 0, error: error || undefined };
    });
    const publish = () => { if (mounted.current) setQueue(items.map((item) => ({ ...item }))); };
    publish();
    let saved = 0;
    for (const item of items) {
      if (!mounted.current) break;
      if (item.state === "error") continue;
      item.state = "uploading";
      publish();
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          activeUpload.current = xhr;
          xhr.open("POST", "/api/intern/documents");
          xhr.setRequestHeader("Content-Type", "application/octet-stream");
          xhr.setRequestHeader("X-File-Name", encodeURIComponent(item.file.name));
          xhr.timeout = 120000;
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) { item.progress = Math.round(event.loaded / event.total * 100); publish(); }
          };
          xhr.onload = () => {
            if (xhr.status === 201) resolve();
            else {
              let message = "Upload failed. Try this document again.";
              try { message = JSON.parse(xhr.responseText).error || message; } catch { /* Keep the actionable fallback. */ }
              reject(new Error(message));
            }
          };
          xhr.onerror = () => reject(new Error("Connection lost. Try this document again."));
          xhr.ontimeout = () => reject(new Error("Upload timed out. Try this document again."));
          xhr.onabort = () => reject(new Error("Upload stopped. You can try again."));
          xhr.send(item.file);
        });
        item.state = "saved";
        item.progress = 100;
        saved++;
      } catch (error) {
        item.state = "error";
        item.error = error instanceof Error ? error.message : "Upload failed. Try again.";
      }
      publish();
    }
    activeUpload.current = null;
    uploadLock.current = false;
    if (!mounted.current) return;
    setUploading(false);
    const failed = items.length - saved;
    setNotice(saved
      ? `${saved} ${saved === 1 ? "document" : "documents"} saved. ${failed ? `${failed} ${failed === 1 ? "file needs" : "files need"} attention in the upload results.` : "Your files are available below."}`
      : "No documents were saved. Check the upload results and try again.");
    if (saved) {
      setPage(1);
      setSearch("");
      setKind("");
      await utils.intern.documents.invalidate();
    }
  }

  async function download(id: string, fileName: string) {
    setBusy(id); setError("");
    try {
      const response = await fetch(`/api/intern/documents/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = fileName;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Download failed. Please try again.");
    } finally { setBusy(null); }
  }

  async function remove(id: string, fileName: string) {
    setBusy(id); setError("");
    try {
      const response = await fetch(`/api/intern/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setDeleting(null);
      setNotice(`Deleted ${fileName}.`);
      if (query.data?.items.length === 1 && page > 1) setPage(page - 1);
      await utils.intern.documents.invalidate();
      heading.current?.focus();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Delete failed. Please try again.");
    } finally { setBusy(null); }
  }

  const failed = queue.filter((item) => item.state === "error");
  return (
    <>
      <PageHeading title="Documents">Store your project documents here and download them whenever you need them.</PageHeading>
      <section className={`${s.panel} ${c.uploadPanel}`} aria-labelledby="upload-heading">
        <div className={c.uploadIntro}>
          <div className={c.uploadIcon}><Upload size={20} aria-hidden="true" /></div>
          <div><h2 id="upload-heading">Upload documents</h2><p>PDF or DOCX · Up to 10 MB each · Only your account can access these files.</p></div>
        </div>
        <div
          className={c.dropZone}
          data-drag-over={dragOver && !uploading}
          onDragOver={(event) => { event.preventDefault(); if (!uploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => { event.preventDefault(); setDragOver(false); void upload(Array.from(event.dataTransfer.files)); }}
        >
          <p>Drag your documents here, or choose files to upload.</p>
          <button className={`${s.button} ${s.primary}`} type="button" disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? <Loader2 size={16} className={s.spin} /> : <Upload size={16} />}
            {uploading ? "Uploading…" : "Choose files"}
          </button>
          <input ref={input} type="file" multiple accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className={c.fileInput} aria-label="Choose PDF or DOCX documents" onChange={(event) => { void upload(Array.from(event.target.files || [])); event.target.value = ""; }} />
        </div>
        {!!queue.length && <div className={c.queue} aria-label="Upload results">
          {queue.map((item, index) => <div key={index} className={c.uploadItem}>
            {item.state === "saved" ? <Check size={17} className={c.saved} /> : item.state === "error" ? <X size={17} className={c.failed} /> : <Loader2 size={17} className={s.spin} />}
            <div className={c.uploadDetail}><span>{item.file.name}</span>
              <p className={item.state === "error" ? c.failed : undefined}>{item.error || (item.state === "saved" ? "Saved" : item.state === "waiting" ? "Waiting…" : item.progress === 100 ? "Saving document…" : `Uploading ${item.progress}%`)}</p>
              {item.state === "uploading" && <progress max={100} value={item.progress} aria-label={`Upload progress for ${item.file.name}`} />}
            </div>
          </div>)}
          {!uploading && failed.length > 0 && <button type="button" className={s.button} onClick={() => void upload(failed.map((item) => item.file))}>Retry failed uploads</button>}
          {!uploading && <button type="button" className={s.button} onClick={() => setQueue([])}>Clear upload results</button>}
        </div>}
      </section>
      {notice && <p role="status" className={c.notice}>{notice}</p>}
      {error && <p role="alert" className={c.error}>{error}</p>}
      <section className={s.panel} aria-labelledby="stored-documents-heading">
        <div className={s.sectionHeading}>
          <div><h2 id="stored-documents-heading" ref={heading} tabIndex={-1}>Your documents</h2><p>{query.data ? `${query.data.total} ${query.data.total === 1 ? "document" : "documents"}${search || kind ? " found" : " stored"}` : "Your saved PDF and Word documents."}</p></div>
        </div>
        <div className={`${s.toolbar} ${c.filters}`}>
          <div className={s.search}><Search size={17} /><input className={s.input} aria-label="Search documents" placeholder="Search by filename…" maxLength={200} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
          <select className={s.input} aria-label="Document type" value={kind} onChange={(event) => { setKind(event.target.value as typeof kind); setPage(1); }}><option value="">All file types</option><option value="pdf">PDF</option><option value="docx">DOCX</option></select>
        </div>
        <QueryState loading={query.isLoading} error={query.error} retry={query.refetch} />
        {query.data && !query.error && (query.data.items.length ? <>
          <div className={c.columnHead} aria-hidden="true"><span>Name</span><span>Type</span><span className={c.size}>Size</span><span>Uploaded</span><span>Actions</span></div>
          <ul className={c.fileList}>{query.data.items.map((file) => <li className={c.fileRow} key={file.id}>
            <div className={c.fileIdentity}><FileText size={19} aria-hidden="true" /><span title={file.fileName}>{file.fileName}</span></div>
            <span className={c.fileType}>{file.mimeType === "application/pdf" ? "PDF" : "DOCX"}</span>
            <span className={c.size}>{documentSize(file.fileSize)}</span>
            <time dateTime={new Date(file.createdAt).toISOString()}>{new Date(file.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</time>
            <div className={c.actions}>
              <button type="button" disabled={!!busy} className={s.button} aria-label={`Download ${file.fileName}`} title="Download" onClick={() => void download(file.id, file.fileName)}>{busy === file.id && deleting !== file.id ? <Loader2 size={17} className={s.spin} /> : <Download size={17} />}<span className={c.mobileLabel}>Download</span></button>
              <button type="button" disabled={!!busy} className={s.button} aria-label={`Delete ${file.fileName}`} title="Delete" onClick={() => setDeleting(deleting === file.id ? null : file.id)}><Trash2 size={17} /><span className={c.mobileLabel}>Delete</span></button>
            </div>
            {deleting === file.id && <div className={c.confirm}>
              <p>Delete <strong>{file.fileName}</strong>? This removes the stored file.</p>
              <div><button type="button" disabled={!!busy} className={`${s.button} ${c.deleteButton}`} onClick={() => void remove(file.id, file.fileName)}>{busy === file.id ? "Deleting…" : "Delete permanently"}</button><button type="button" disabled={!!busy} className={s.button} onClick={() => setDeleting(null)}>Cancel</button></div>
            </div>}
          </li>)}</ul>
        </> : <Empty title={search || kind ? "No matching documents" : "No documents yet"}>{search || kind ? "Try another filename or file type." : "Upload your first PDF or DOCX above. It will stay here for your next visit."}</Empty>)}
        {query.data && <Pagination page={page} pages={query.data.pages} onChange={setPage} />}
      </section>
    </>
  );
}
