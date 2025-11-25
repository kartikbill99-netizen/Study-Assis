import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const prompt = req.body.prompt || "Hello";

    // Initialize the Gemini AI with API key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent(prompt);

    // Use correct property from Gemini response
    const outputText = response.response?.text || "No response";

    res.status(200).json({ reply: outputText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
