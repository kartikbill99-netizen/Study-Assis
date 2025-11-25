// api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST requests allowed" });
    }

    const prompt = req.body.prompt || "Hello";

    // Load API key securely from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent(prompt);

    res.status(200).json({
      title: "AI Study Assistant 🤖",
      emoji: "✨",
      reply: response.response.text(),
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
