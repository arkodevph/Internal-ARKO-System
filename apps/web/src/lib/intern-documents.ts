export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const INTERN_DOCUMENT_TYPE = "INTERN_DOCUMENT";
export const DOCUMENT_MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export function documentFileError(name: string, size: number): string | null {
  if (!name.trim() || name.length > 200 || /[\x00-\x1f\x7f/\\]/.test(name))
    return "Use a filename of up to 200 characters without slashes or control characters.";
  if (!/\.(pdf|docx)$/i.test(name.trim()))
    return "Choose a PDF or DOCX document.";
  if (size === 0) return "This file is empty. Choose a document with content.";
  if (size > MAX_DOCUMENT_SIZE) return "Each document must be 10 MB or smaller.";
  return null;
}

export function documentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
