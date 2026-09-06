import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./db/connection.js";
import { seedIfEmpty } from "./db/seed.js";
import { challengesRouter } from "./routes/challenges.routes.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { universitiesRouter } from "./routes/universities.routes.js";
import { industryRouter } from "./routes/industry.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { knowledgeRouter } from "./routes/knowledge.routes.js";
import { mentorRouter } from "./routes/mentor.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "JanaSetu Backend API", time: new Date() });
});

// Mount Routes
app.use("/api/challenges", challengesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/universities", universitiesRouter);
app.use("/api/industry", industryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/mentor", mentorRouter);

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 JanaSetu Backend Server running on http://localhost:${PORT}`);
  const isConnected = await testConnection();
  if (isConnected) {
    await seedIfEmpty();
  }
});
