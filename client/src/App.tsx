import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Nav } from "./components/Nav.js";
import { HomePage } from "./pages/HomePage.js";
import { ChallengesPage } from "./pages/ChallengesPage.js";
import { NewChallengePage } from "./pages/NewChallengePage.js";
import { ChallengeDetailPage } from "./pages/ChallengeDetailPage.js";
import { ProjectsPage } from "./pages/ProjectsPage.js";
import { ProjectDetailPage } from "./pages/ProjectDetailPage.js";
import { UniversitiesPage } from "./pages/UniversitiesPage.js";
import { UniversityDetailPage } from "./pages/UniversityDetailPage.js";
import { IndustryPage } from "./pages/IndustryPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { KnowledgePage } from "./pages/KnowledgePage.js";
import { MentorPage } from "./pages/MentorPage.js";

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Inter',sans-serif]">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex-1 w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/challenges/new" element={<NewChallengePage />} />
            <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/universities" element={<UniversitiesPage />} />
            <Route path="/universities/:id" element={<UniversityDetailPage />} />
            <Route path="/industry" element={<IndustryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/mentor" element={<MentorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>JanaSetu AI — Societal Innovation Exchange for Smart India Hackathon</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
