// api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Vercel / Next-style serverless function compatible handler.
 * - Expects POST JSON: { prompt: "..." }
 * - Reads API key from process.env.GEMINI_API_KEY
 * - Tries several common response shapes from Gemini SDK to extract text safely
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  // Basic checks
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server misconfiguration: GEMINI_API_KEY missing" });
  }

  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'prompt' in request body" });
  }

  try {
    // Initialize SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Many SDK examples call getGenerativeModel then generateContent
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Call the model - we pass prompt directly (SDKs vary)
    const response = await model.generateContent(prompt);

    // Robust extraction of text from different possible response shapes
    let reply = "No response from model.";
    try {
      if (!response) {
        reply = "Empty response object from model.";
      } else if (typeof response === "string") {
        reply = response;
      } else if (response?.response) {
        // response.response might be an object or have .text() method
        const r = response.response;
        if (typeof r === "string") reply = r;
        else if (typeof r.text === "function") reply = r.text(); // some SDKs return functions
        else if (typeof r.text === "string") reply = r.text;
        else reply = JSON.stringify(r).slice(0, 4000);
      } else if (Array.isArray(response?.output) && response.output.length) {
        // fallback: look for a text item in output array
        const first = response.output.find(it => it?.type === "text") ?? response.output[0];
        reply = first?.text ?? JSON.stringify(first).slice(0, 4000);
      } else if (response?.content) {
        reply = typeof response.content === "string" ? response.content : JSON.stringify(response.content).slice(0, 4000);
      } else {
        // Last-resort stringify
        reply = JSON.stringify(response).slice(0, 4000);
      }
    } catch (parseErr) {
      console.error("Error parsing model response:", parseErr);
      reply = "Could not parse model response.";
    }

    // Return structured reply (frontend expects title + emoji + reply)
    return res.status(200).json({
      title: "AI Study Assistant 🤖",
      emoji: "✨",
      reply,
    });
  } catch (err) {
    console.error("Gemini API error:", err);
    // Return sanitized message to client
    return res.status(500).json({ error: "Server error when calling Gemini API" });
  }
}
