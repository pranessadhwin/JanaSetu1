import { Router } from "express";
import { db } from "../db/connection.js";
import { knowledgeBase } from "../db/schema.js";

export const knowledgeRouter = Router();

// GET knowledge base items with search
knowledgeRouter.get("/", async (req, res) => {
  try {
    const { q, category, type } = req.query;
    const items = await db.select().from(knowledgeBase);

    let filtered = items;
    if (category && typeof category === "string") {
      filtered = filtered.filter((k) => k.category === category);
    }
    if (type && typeof type === "string") {
      filtered = filtered.filter((k) => k.type === type);
    }
    if (q && typeof q === "string") {
      const search = q.toLowerCase();
      filtered = filtered.filter((k) =>
        k.title.toLowerCase().includes(search) ||
        k.summary.toLowerCase().includes(search) ||
        k.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
