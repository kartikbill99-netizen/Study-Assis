// api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Use environment variable for API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent(prompt);

    res.status(200).json({
      reply: `💡 AI says: ${response.response.text()}`
    });
  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
