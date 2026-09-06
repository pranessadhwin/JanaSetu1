import { Router } from "express";
import { db } from "../db/connection.js";
import { knowledgeBase } from "../db/schema.js";
import { mentorCopilot } from "../services/ai.js";

export const mentorRouter = Router();

// POST AI mentor chat
mentorRouter.post("/chat", async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required." });
    }

    let kb: any[] = [];
    try {
      kb = await db.select().from(knowledgeBase);
    } catch (err: any) {
      console.warn("Knowledge base DB query fell back (MySQL offline):", err.message);
    }

    const result = await mentorCopilot(question, kb, context);
    res.json({
      answer: result.answer,
      sources: (result.sources || []).map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        source: s.source,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
