// ============================================================
// routes/ai.js — POST /api/ai
// Closely integrated with AIChatPanel.jsx
// ============================================================

import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const OPENAI_API_URL = `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;
const OLLAMA_API_URL = `${(process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "")}/api/chat`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const AI_MODEL_OPENAI = "gpt-4o-mini";
const AI_MODEL_GEMINI = "gemini-1.5-flash";

// ── System prompt per emergency type ────────────────────────
const SYSTEM_PROMPTS = {
  medical: `You are LifeSaver AI – a medical emergency assistant. Give clear, numbered first-aid steps.
Ask what symptoms the user sees. Cover: bleeding, CPR, choking, unconsciousness. Keep answers under 100 words.
Always end with "Call emergency services if not done yet."`,

  women_safety: `You are LifeSaver AI – a women safety assistant. The user is in danger.
Give calm, practical guidance: find witnesses, move to public space, how to alert police discreetly.
Keep responses short. Do NOT panic the user.`,

  fire: `You are LifeSaver AI – a fire emergency assistant. Guide evacuation.
Answer: which exit to use, how to check doors for heat, how to signal if trapped.
Ask: Are you inside or outside? What floor? Is there smoke? Keep under 80 words.`,

  flood: `You are LifeSaver AI – a flood emergency assistant.
Guide: move to higher ground, what to carry, what NOT to do (don't walk through water).
Ask: ground floor or upper floor? Is water rising? Keep under 80 words.`,

  earthquake: `You are LifeSaver AI – an earthquake assistant.
Guide: DROP-COVER-HOLD, post-quake safety, gas leak checks.
Ask: has shaking stopped? Any injuries? Are you near windows? Keep under 80 words.`,

  general: `You are a life-saving emergency assistant. 
Give short, clear, step-by-step instructions. 
Prioritize safety. 
Avoid long explanations. 
If situation is critical, tell user to call emergency services immediately.`,
};

const FALLBACK = {
  medical:
    "Stay calm. Check breathing. Call 108. Begin CPR if needed (30 compressions : 2 breaths). What symptoms do you see?",
  fire: "EVACUATE NOW via stairs. Cover nose. Stay low. Call 101. Are you inside or outside?",
  flood:
    "Move to higher ground immediately. Don't walk through water. Call 112. What floor are you on?",
  earthquake:
    "DROP, COVER, HOLD. Stay away from windows. After shaking stops, exit carefully. Has it stopped?",
  women_safety:
    "Alert sent to volunteers. Move to a public area. Call 100 or 1091. Can you shout for help?",
  general:
    "Emergency services are needed. Please stay calm and find a safe area until help arrives.",
};

// ── POST /api/ai ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  const {
    message,
    emergencyType = "general",
    history = [],
    location,
  } = req.body;

  if (!message) return res.status(400).json({ error: "message is required" });

  const systemPrompt = SYSTEM_PROMPTS[emergencyType] || SYSTEM_PROMPTS.general;
  const locationNote = location
    ? `\nUser location: lat ${Number(location.lat).toFixed(4)}, lng ${Number(location.lng).toFixed(4)}.`
    : "";

  const normalizedHistory = Array.isArray(history)
    ? history
        .slice(-6)
        .map((m) => ({
          role: m?.role === "assistant" ? "assistant" : "user",
          content: typeof m?.content === "string" ? m.content : "",
        }))
        .filter((m) => m.content.trim().length > 0)
    : [];

  // ── 1. Try Ollama (Local, Free) ───────────────────────────
  if (process.env.OLLAMA_ENABLED !== "false") {
    try {
      const ollamaMessages = [
        { role: "system", content: `${systemPrompt}${locationNote}` },
        ...normalizedHistory,
        { role: "user", content: message },
      ];

      const { data } = await axios.post(
        OLLAMA_API_URL,
        {
          model: OLLAMA_MODEL,
          messages: ollamaMessages,
          stream: false,
        },
        { timeout: 18000 },
      );

      const reply = data?.message?.content?.trim();
      if (reply) {
        console.info(`[AI] ✅ Ollama (${OLLAMA_MODEL}) response served`);
        return res.json({ reply, provider: `ollama:${OLLAMA_MODEL}`, offline: true });
      }
    } catch (ollamaError) {
      const errMsg = ollamaError.code === "ECONNREFUSED"
        ? "Ollama not running on localhost:11434"
        : ollamaError.response?.data || ollamaError.message;
      console.warn("[AI] Ollama Error:", errMsg);
    }
  }

  // ── 2. Try Google Gemini ───────────────────────────────────
  if (
    process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.includes("your_")
  ) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: AI_MODEL_GEMINI });

      const fullPrompt = `System: ${systemPrompt}${locationNote}\n\nHistory:\n${normalizedHistory
        .slice(-4)
        .map((h) => `${h.role}: ${h.content}`)
        .join("\n")}\nUser: ${message}`;

      const result = await model.generateContent(fullPrompt);
      const reply = result.response.text();

      if (reply) {
        console.info(`[AI] ✅ Gemini (${emergencyType}) response served`);
        return res.json({ reply, provider: AI_MODEL_GEMINI, offline: false });
      }
    } catch (gemError) {
      console.error("[AI] Gemini Error:", gemError.message);
    }
  }

  // ── 3. Try OpenAI-compatible provider ──────────────────────
  if (
    process.env.OPENAI_API_KEY &&
    !process.env.OPENAI_API_KEY.includes("your_")
  ) {
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: AI_MODEL_OPENAI,
          messages: [
            { role: "system", content: systemPrompt + locationNote },
            ...normalizedHistory,
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 400,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          timeout: 12000,
        },
      );

      const reply = response.data.choices?.[0]?.message?.content?.trim();
      if (reply) {
        console.info(`[AI] ✅ OpenAI (${emergencyType}) response served`);
        return res.json({ reply, provider: AI_MODEL_OPENAI, offline: false });
      }
    } catch (openaiError) {
      console.error(
        "[AI] OpenAI Error:",
        openaiError.response?.data || openaiError.message,
      );
    }
  }

  // ── 4. Hardcoded Fallback ───────────────────────────────────
  console.warn(
    `[AI] Both providers failed for ${emergencyType} — returning static response`,
  );
  return res.json({
    reply: FALLBACK[emergencyType] || FALLBACK.general,
    offline: true,
    provider: "fallback",
  });
});

export default router;
