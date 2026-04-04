import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const OPENAI_API_URL = `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;

/**
 * POST /api/chat
 * Emergency Chat Assistant (Gemini / OpenAI)
 */
router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  // ── Try Google Gemini first (if key exists) ────────────────
  if (
    process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.includes("your_")
  ) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `System: You are a life-saving emergency assistant. Give short, clear, step-by-step instructions. Prioritize safety. Avoid long explanations. If situation is critical, tell user to call emergency services immediately.
      
      User: ${message}`;

      const result = await model.generateContent(prompt);
      const reply = result.response.text();

      console.info("[Chat] ✅ Gemini response served");
      return res.json({ reply, provider: "gemini" });
    } catch (gemError) {
      console.error("[Chat] Gemini Error:", gemError.message);
      // Fall through to OpenAI
    }
  }

  // ── Try OpenAI fallback ─────────────────────────────────────
  if (
    process.env.OPENAI_API_KEY &&
    !process.env.OPENAI_API_KEY.includes("your_")
  ) {
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a life-saving emergency assistant. Give short, clear, step-by-step instructions. Prioritize safety. Avoid long explanations. If situation is critical, tell user to call emergency services immediately.`,
            },
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 300,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          timeout: 10000,
        },
      );

      const reply = response.data.choices?.[0]?.message?.content;
      if (reply) {
        console.info("[Chat] ✅ OpenAI response served");
        return res.json({ reply, provider: "openai" });
      }
    } catch (openaiError) {
      console.error(
        "[Chat] OpenAI Error:",
        openaiError.response?.data || openaiError.message,
      );
    }
  }

  // ── Static Fallback (Offline Mode) ──────────────────────────
  console.warn(
    "[Chat] Both AI providers failed or missing key — returning fallback",
  );
  return res.json({
    reply:
      "Emergency services are needed. Please stay calm and find a safe area until help arrives.",
    provider: "fallback",
    offline: true,
  });
});

export default router;
