import { createRateLimiter } from "../../../../lib/rate-limit";
import {
  assertDocumentOrigin, documentUser, DocumentError,
  documentErrorResponse, readDocumentBody, saveDocument,
} from "../../../../server/services/intern-documents";

export const runtime = "nodejs";
export const maxDuration = 60;
const uploads = createRateLimiter("intern-document-uploads", { windowMs: 60000, maxRequests: 20 });

export async function POST(request: Request) {
  try {
    assertDocumentOrigin(request);
    const user = await documentUser();
    if (!uploads.check(user.id).success) throw new DocumentError(429, "Too many uploads. Wait a minute and try again.");
    let name: string;
    try { name = decodeURIComponent(request.headers.get("x-file-name") ?? ""); }
    catch { throw new DocumentError(400, "Choose a document with a valid filename."); }
    const file = await saveDocument(user.id, name, await readDocumentBody(request));
    return Response.json(file, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
