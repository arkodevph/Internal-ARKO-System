import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { zipSync, strToU8 } from "fflate";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

jest.mock("../../../lib/auth", () => ({ auth: jest.fn<any>() }));
jest.mock("../../../lib/s3", () => ({ s3: { send: jest.fn<any>() }, S3_BUCKET: "test-bucket" }));
jest.mock("@arko/db", () => ({ prisma: {
  user: { findUnique: jest.fn<any>() },
  fileAttachment: { create: jest.fn<any>(), findFirst: jest.fn<any>(), delete: jest.fn<any>() },
} }));

import { prisma } from "@arko/db";
import { auth } from "../../../lib/auth";
import { s3 } from "../../../lib/s3";
import { DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE } from "../../../lib/intern-documents";
import { assertDocumentOrigin, documentUser, ownedDocument, readDocumentBody, saveDocument, validateDocument } from "../intern-documents";
import { POST } from "../../../app/api/intern/documents/route";
import { GET, DELETE } from "../../../app/api/intern/documents/[id]/route";

const mocked = { auth: auth as jest.Mock<any>, user: prisma.user.findUnique as jest.Mock<any>,
  create: prisma.fileAttachment.create as jest.Mock<any>, find: prisma.fileAttachment.findFirst as jest.Mock<any>,
  delete: prisma.fileAttachment.delete as jest.Mock<any>, send: s3.send as jest.Mock<any> };
const pdf = Buffer.from("%PDF-1.7\n1 0 obj <<>> endobj\n%%EOF\n");
function docx(extra: Record<string, Uint8Array> = {}) {
  return zipSync({
    "[Content_Types].xml": strToU8('<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" /></Types>'),
    "word/document.xml": strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>'),
    ...extra,
  });
}
function uploadRequest(name = "report.pdf", body: Uint8Array = pdf, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/intern/documents", { method: "POST", headers: { origin, "x-file-name": encodeURIComponent(name) }, body });
}
const context = { params: Promise.resolve({ id: "file-1" }) };

beforeEach(() => {
  Object.values(mocked).forEach((fn) => fn.mockReset());
  mocked.auth.mockResolvedValue({ user: { id: "intern-1" } });
  mocked.user.mockResolvedValue({ id: "intern-1", role: "INTERN", status: "ACTIVE" });
  mocked.send.mockResolvedValue({});
  mocked.create.mockResolvedValue({ id: "file-1", fileName: "report.pdf" });
  mocked.find.mockResolvedValue(null);
  mocked.delete.mockResolvedValue({ id: "file-1" });
});

describe("intern document formats and upload limits", () => {
  it("recognizes PDF and DOCX contents without trusting the supplied MIME type", () => {
    expect(validateDocument("report.PDF", pdf)).toBe(DOCUMENT_MIME_TYPES.pdf);
    expect(validateDocument("report.docx", docx())).toBe(DOCUMENT_MIME_TYPES.docx);
  });
  it.each(["report.exe", "../report.pdf", "bad\nname.pdf", "a".repeat(200) + ".pdf"])("rejects unsupported or unsafe filename %s", (name) => {
    expect(() => validateDocument(name, pdf)).toThrow();
  });
  it("rejects renamed files, incomplete PDFs, empty files and non-Word ZIP archives", () => {
    for (const [name, body] of [["report.pdf", docx()], ["report.docx", pdf], ["report.pdf", Buffer.from("%PDF-1.7")], ["report.pdf", Buffer.alloc(0)], ["report.docx", zipSync({ "notes.txt": strToU8("text") })]] as const)
      expect(() => validateDocument(name, body)).toThrow();
  });
  it("rejects macros and oversized DOCX archive entries", () => {
    expect(() => validateDocument("report.docx", docx({ "word/vbaProject.bin": strToU8("macro") }))).toThrow();
    expect(() => validateDocument("report.docx", docx({ "word/document.xml": new Uint8Array(MAX_DOCUMENT_SIZE + 1) }))).toThrow();
  });
  it("bounds raw request streams even without Content-Length", async () => {
    const request = uploadRequest("large.pdf", new Uint8Array(MAX_DOCUMENT_SIZE + 1));
    await expect(readDocumentBody(request)).rejects.toMatchObject({ status: 413 });
    expect(mocked.send).not.toHaveBeenCalled();
  });
  it("rejects declared oversize requests before consuming the stream", async () => {
    const request = uploadRequest();
    request.headers.set("content-length", String(MAX_DOCUMENT_SIZE + 1));
    await expect(readDocumentBody(request)).rejects.toMatchObject({ status: 413 });
    expect(request.bodyUsed).toBe(false);
  });
});

describe("intern document access and persistence", () => {
  it("checks the current account role and active status", async () => {
    mocked.auth.mockResolvedValueOnce(null);
    await expect(documentUser()).rejects.toMatchObject({ status: 401 });
    for (const user of [{ role: "MEMBER", status: "ACTIVE" }, { role: "INTERN", status: "SUSPENDED" }]) {
      mocked.user.mockResolvedValueOnce({ id: "intern-1", ...user });
      await expect(documentUser()).rejects.toMatchObject({ status: 403 });
    }
    mocked.user.mockResolvedValueOnce({ id: "admin-1", role: "ADMIN", status: "ACTIVE" });
    expect(await documentUser()).toMatchObject({ id: "admin-1" });
  });
  it("stores bytes and private metadata under a server-generated owner key", async () => {
    await saveDocument("intern-1", "report.pdf", pdf);
    const command = mocked.send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({ Bucket: "test-bucket", Body: pdf, ContentType: "application/pdf" });
    expect(command.input.Key).toMatch(/^intern-1\/intern-documents\/[\da-f-]+\.pdf$/);
    expect(mocked.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "intern-1", scope: "PERSONAL", resourceType: "INTERN_DOCUMENT", fileName: "report.pdf", fileSize: pdf.length }) }));
  });
  it("does not create metadata when storage fails and removes an object after a metadata failure", async () => {
    mocked.send.mockRejectedValueOnce(new Error("Storage unavailable"));
    await expect(saveDocument("intern-1", "report.pdf", pdf)).rejects.toThrow();
    expect(mocked.create).not.toHaveBeenCalled();
    mocked.create.mockRejectedValueOnce(new Error("DB unavailable"));
    await expect(saveDocument("intern-1", "report.pdf", pdf)).rejects.toThrow("DB unavailable");
    expect(mocked.send.mock.calls[2][0]).toBeInstanceOf(DeleteObjectCommand);
  });
  it("always scopes document lookup to the signed-in owner, type and visibility", async () => {
    await expect(ownedDocument("intern-1", "other-file")).rejects.toMatchObject({ status: 404 });
    expect(mocked.find).toHaveBeenCalledWith({ where: { id: "other-file", userId: "intern-1", resourceType: "INTERN_DOCUMENT", scope: "PERSONAL" } });
  });
});

describe("intern document HTTP routes", () => {
  it("compares the browser origin to the actual Host when Next uses a different listener hostname", () => {
    const request = uploadRequest();
    request.headers.set("host", "127.0.0.1:3000");
    request.headers.set("origin", "http://127.0.0.1:3000");
    expect(() => assertDocumentOrigin(request)).not.toThrow();
    request.headers.set("origin", "http://localhost:3000");
    expect(() => assertDocumentOrigin(request)).toThrow();
    request.headers.set("origin", "https://127.0.0.1:3000");
    request.headers.set("x-forwarded-proto", "https");
    expect(() => assertDocumentOrigin(request)).not.toThrow();
  });
  it("rejects cross-origin writes, missing sessions and unsupported documents without saving", async () => {
    expect((await POST(uploadRequest("report.pdf", pdf, "https://elsewhere.example"))).status).toBe(403);
    mocked.auth.mockResolvedValueOnce(null);
    expect((await POST(uploadRequest())).status).toBe(401);
    expect((await POST(uploadRequest("script.pdf", Buffer.from("<script>bad</script>")))).status).toBe(400);
    expect(mocked.send).not.toHaveBeenCalled();
  });
  it("returns a stored result only after both storage and metadata succeed", async () => {
    const response = await POST(uploadRequest());
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ id: "file-1" });
  });
  it("does not reveal or delete a different user's document", async () => {
    expect((await GET(new Request("http://localhost:3000/api/intern/documents/file-1"), context)).status).toBe(404);
    expect((await DELETE(new Request("http://localhost:3000/api/intern/documents/file-1", { method: "DELETE", headers: { origin: "http://localhost:3000" } }), context)).status).toBe(404);
    expect(mocked.send).not.toHaveBeenCalled();
    expect(mocked.delete).not.toHaveBeenCalled();
  });
  it("streams stored bytes with a download filename and no cache", async () => {
    mocked.find.mockResolvedValueOnce({ id: "file-1", fileKey: "owner/key", fileName: "Résumé.pdf", mimeType: "application/pdf" });
    mocked.send.mockResolvedValueOnce({ ContentLength: pdf.length, Body: { transformToWebStream: () => new ReadableStream({ start(controller) { controller.enqueue(pdf); controller.close(); } }) } });
    const response = await GET(new Request("http://localhost:3000/api/intern/documents/file-1"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("filename*=UTF-8''R%C3%A9sum%C3%A9.pdf");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(pdf);
  });
  it("deletes stored bytes before metadata, and keeps metadata if storage deletion fails", async () => {
    mocked.find.mockResolvedValue({ id: "file-1", fileKey: "owner/key" });
    const request = () => new Request("http://localhost:3000/api/intern/documents/file-1", { method: "DELETE", headers: { origin: "http://localhost:3000" } });
    mocked.send.mockRejectedValueOnce(new Error("Storage unavailable"));
    expect((await DELETE(request(), context)).status).toBe(503);
    expect(mocked.delete).not.toHaveBeenCalled();
    expect((await DELETE(request(), context)).status).toBe(200);
    expect(mocked.delete).toHaveBeenCalledWith({ where: { id: "file-1" } });
  });
});
