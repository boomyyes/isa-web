// POST /api/forms/<form> — public form submissions. See lib/forms/server.ts.

import { isFormName } from "@/lib/forms/schemas";
import { handleSubmission } from "@/lib/forms/server";

/** node:dns and nodemailer need the Node runtime. */
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  if (!isFormName(form)) {
    return Response.json({ error: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return handleSubmission(request, form);
}
