import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { GEMINI_API_KEY } from "./api.js";
import { createStudyLandmarkHandler } from "./study-landmark-api.ts";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const studyHandler = createStudyLandmarkHandler(GEMINI_API_KEY);

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);

  if (url.pathname === "/api/study-landmark" || url.pathname === "/api/study-guide") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    try {
      const chunks = [];
      let size = 0;
      let tooLarge = false;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 8_192) {
          tooLarge = true;
          continue;
        }
        if (!tooLarge) chunks.push(chunk);
      }
      if (tooLarge) {
        sendJson(response, 413, { error: "Study guide request is too large." });
        return;
      }

      const body = Buffer.concat(chunks).toString("utf8");
      const apiRequest = new Request(`http://${host}:${port}${url.pathname}`, {
        method: "POST",
        headers: { "Content-Type": request.headers["content-type"] || "application/json" },
        body
      });
      const apiResponse = await studyHandler(apiRequest);
      response.writeHead(apiResponse.status, Object.fromEntries(apiResponse.headers));
      response.end(await apiResponse.text());
    } catch (error) {
      console.error("PawPort study API request failed.", error);
      if (!response.headersSent) sendJson(response, 500, { error: "The study guide server encountered an unexpected error." });
      else response.destroy(error);
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (url.pathname !== "/" && url.pathname !== "/testing%20copy.html" && url.pathname !== "/testing copy.html") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  try {
    const html = await readFile(join(rootDirectory, "testing copy.html"));
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    });
    response.end(request.method === "HEAD" ? undefined : html);
  } catch (error) {
    console.error("Could not read the PawPort app HTML.", error);
    sendJson(response, 500, { error: "Could not load the PawPort app." });
  }
});

server.listen(port, host, () => {
  console.log(`PawPort is running at http://${host}:${port}`);
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set; study guide requests will return a configuration error.");
  }
});

server.on("error", (error) => {
  console.error("Could not start the PawPort server.", error);
  process.exitCode = 1;
});
