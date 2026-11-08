import { createStudyLandmarkHandler } from "../study-landmark-api.ts";
import { GEMINI_API_KEY } from "../api.js";

const handleStudyLandmark = createStudyLandmarkHandler(GEMINI_API_KEY);

export default async function studyLandmark(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const body = typeof request.body === "string"
    ? request.body
    : JSON.stringify(request.body ?? {});

  try {
    const apiRequest = new Request("https://pawport-api.local/api/study-landmark", {
      method: "POST",
      headers: { "Content-Type": request.headers["content-type"] || "application/json" },
      body
    });
    const apiResponse = await handleStudyLandmark(apiRequest);
    response.status(apiResponse.status);
    for (const [name, value] of apiResponse.headers) {
      response.setHeader(name, value);
    }
    return response.send(await apiResponse.text());
  } catch (error) {
    console.error("Vercel PawPort Study Hub function failed.", error);
    return response.status(500).json({ error: "The study guide service encountered a server error." });
  }
}
