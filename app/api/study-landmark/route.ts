import { createStudyLandmarkHandler } from "../../../study-landmark-api";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    return Response.json({ error: "Study guide service is not configured." }, { status: 503 });
  }
  return createStudyLandmarkHandler(apiKey)(request);
}
