# PawPort

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. In **Project Settings → Environment Variables**, add `GEMINI_API_KEY` with your Google AI Studio key. Enable it for the Production environment (and Preview if desired).
3. Redeploy after adding or changing the variable.

Vercel serves the existing PawPort page (`testing copy.html`) at `/` using `vercel.json` and exposes the Gemini proxy at `/api/study-landmark`. The browser never receives the API key. `api.js` reads the server environment variable and must not be imported by frontend code.

If a Gemini key was previously committed, shared, or placed in browser-delivered code, revoke it and create a replacement before deploying. For HTTP 403 responses, confirm the new key is valid, the Generative Language API is enabled for its Google Cloud project, and the key's API restrictions allow that API.

## Run locally

For local development, set `GEMINI_API_KEY` in the server process environment and start `node --experimental-strip-types server.mjs`. The server prints the local URL when it starts.