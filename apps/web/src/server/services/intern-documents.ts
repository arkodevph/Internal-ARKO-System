import { randomUUID } from "node:crypto";
import { unzipSync } from "fflate";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@arko/db";
import { auth } from "../../lib/auth";
import { s3, S3_BUCKET } from "../../lib/s3";
import {
  DOCUMENT_MIME_TYPES,
  INTERN_DOCUMENT_TYPE,
  MAX_DOCUMENT_SIZE,
  documentFileError,
} from "../../lib/intern-documents";

export class DocumentError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function documentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new DocumentError(401, "Sign in to access your documents.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE" || !["INTERN", "ADMIN"].includes(user.role))
    throw new DocumentError(403, "This account cannot access intern documents.");
  return user;
}

export function assertDocumentOrigin(request: Request) {
  // Next can construct request.url with its listener hostname (localhost), even
  // when the browser used 127.0.0.1. Compare against the actual request Host.
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? url.protocol.slice(0, -1);
  if (!["http", "https"].includes(protocol) || request.headers.get("origin") !== `${protocol}://${host}`)
    throw new DocumentError(403, "Open the portal and try again.");
}

export async function readDocumentBody(request: Request) {
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_DOCUMENT_SIZE) throw new DocumentError(413, "Each document must be 10 MB or smaller.");
  const reader = request.body?.getReader();
  if (!reader) throw new DocumentError(400, "Choose a document to upload.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DOCUMENT_SIZE) {
        await reader.cancel();
        throw new DocumentError(413, "Each document must be 10 MB or smaller.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

export function validateDocument(name: string, bytes: Uint8Array) {
  const error = documentFileError(name, bytes.byteLength);
  if (error) throw new DocumentError(bytes.byteLength > MAX_DOCUMENT_SIZE ? 413 : 400, error);
  if (/\.pdf$/i.test(name.trim())) {
    const head = Buffer.from(bytes.subarray(0, 8)).toString("ascii");
    const tail = Buffer.from(bytes.subarray(Math.max(0, bytes.length - 1024))).toString("ascii");
    if (!/^%PDF-\d\.\d/.test(head) || !tail.includes("%%EOF"))
      throw new DocumentError(400, "This file is not a valid PDF. Export it as PDF and try again.");
    return DOCUMENT_MIME_TYPES.pdf;
  }
  try {
    let entries = 0;
    let expandedSize = 0;
    const required = new Set(["[Content_Types].xml", "word/document.xml"]);
    const files = unzipSync(bytes, {
      filter(file) {
        entries++;
        expandedSize += file.originalSize;
        if (entries > 10000 || expandedSize > 100 * 1024 * 1024 || /vbaProject\.bin$/i.test(file.name))
          throw new Error("Unsupported archive");
        if (!required.has(file.name)) return false;
        if (file.originalSize > MAX_DOCUMENT_SIZE) throw new Error("Document XML too large");
        return true;
      },
    });
    const types = files["[Content_Types].xml"];
    const doc = files["word/document.xml"];
    if (!types || !doc) throw new Error("Missing document content");
    const contentTypes = Buffer.from(types).toString("utf8");
    const documentXml = Buffer.from(doc).toString("utf8");
    if (!contentTypes.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml") ||
        !/<(?:[\w.-]+:)?document[\s>]/.test(documentXml))
      throw new Error("Not a Word document");
    return DOCUMENT_MIME_TYPES.docx;
  } catch {
    throw new DocumentError(400, "This file is not a valid DOCX. Save it as a Word document and try again.");
  }
}

export async function saveDocument(userId: string, fileName: string, bytes: Buffer) {
  const mimeType = validateDocument(fileName, bytes);
  if (!S3_BUCKET) throw new DocumentError(503, "Document storage is unavailable. Please try again later.");
  const fileKey = `${userId}/intern-documents/${randomUUID()}.${mimeType === DOCUMENT_MIME_TYPES.pdf ? "pdf" : "docx"}`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key: fileKey, Body: bytes, ContentType: mimeType,
  }));
  try {
    return await prisma.fileAttachment.create({
      data: {
        userId, resourceType: INTERN_DOCUMENT_TYPE, resourceId: userId,
        scope: "PERSONAL", fileKey, fileName: fileName.trim(),
        fileSize: bytes.byteLength, mimeType,
      },
      select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
    });
  } catch (error) {
    // A failed metadata save must not leave an unlisted uploaded object.
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: fileKey })).catch(() => undefined);
    throw error;
  }
}

export async function ownedDocument(userId: string, id: string) {
  const file = await prisma.fileAttachment.findFirst({
    where: { id, userId, resourceType: INTERN_DOCUMENT_TYPE, scope: "PERSONAL" },
  });
  if (!file) throw new DocumentError(404, "Document not found.");
  return file;
}

export function documentErrorResponse(error: unknown) {
  return Response.json({
    error: error instanceof DocumentError ? error.message : "Document storage is unavailable. Please try again.",
  }, {
    status: error instanceof DocumentError ? error.status : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
