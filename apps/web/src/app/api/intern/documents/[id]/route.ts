import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@arko/db";
import { s3, S3_BUCKET } from "../../../../../lib/s3";
import {
  assertDocumentOrigin, documentUser, DocumentError,
  documentErrorResponse, ownedDocument,
} from "../../../../../server/services/intern-documents";

export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await documentUser();
    const file = await ownedDocument(user.id, (await context.params).id);
    const object = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.fileKey }));
    if (!object.Body) throw new DocumentError(404, "Document not found.");
    const name = encodeURIComponent(file.fileName).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="document.${file.mimeType === "application/pdf" ? "pdf" : "docx"}"; filename*=UTF-8''${name}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(object.ContentLength !== undefined ? { "Content-Length": String(object.ContentLength) } : {}),
      },
    });
  } catch (error) {
    return documentErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertDocumentOrigin(request);
    const user = await documentUser();
    const file = await ownedDocument(user.id, (await context.params).id);
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: file.fileKey }));
    await prisma.fileAttachment.delete({ where: { id: file.id } });
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
