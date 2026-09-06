import React, { useEffect, useState, useRef } from "react";
import { getProjects, askMentorCopilot } from "../services/api.js";

type Msg = {
  role: "user" | "assistant";
  text: string;
  sources?: { id: number; title: string; type: string; source: string }[];
};

const SUGGESTIONS = [
  "How do I design a low-cost rainwater harvesting system for a village handpump?",
  "What sensors should we use for a solar-powered water level monitor?",
  "How should we plan a pilot in 2–3 villages?",
  "How can we keep the solution affordable and maintainable locally?",
];

export function MentorPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [ctx, setCtx] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = () => {
    if (listening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setListening(false);
      return;
    }

    const w = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = "en-IN";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (e: any) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setQ(transcript);
      };

      rec.onerror = () => {
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);

    try {
      const data = await askMentorCopilot({ question, context: ctx || undefined });
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: data.answer || "No answer returned.",
          sources: data.sources,
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Could not reach the AI mentor service. Ensure the server is running on port 5000." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Mentor Copilot</h1>
        <p className="text-sm text-slate-600">
          Field-tested technical guidance for university student teams, grounded in rural case studies and engineering guidelines.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3 bg-slate-50">
          <label className="text-xs font-medium text-slate-600">Project context:</label>
          <select
            value={ctx}
            onChange={(e) => setCtx(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            <option value="">None (General Inquiry)</option>
            {projects.map((p) => (
              <option key={p.id} value={`${p.title} (${p.category})`}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 p-4">
          {msgs.length === 0 && (
            <div>
              <p className="text-sm text-slate-500">Suggested questions:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-xs ${
                  m.role === "user" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <p className="mt-2 border-t border-slate-200/60 pt-2 text-xs opacity-75">
                    Sources: {m.sources.map((s) => `${s.title} (${s.type})`).join("; ")}
                  </p>
                )}
              </div>
            </div>
          ))}

          {busy && <p className="text-xs text-slate-400">Thinking and searching knowledge base…</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
          className="flex gap-2 border-t border-slate-100 p-3 bg-white"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask a technical or field design question…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleVoice}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer border ${
              listening
                ? "bg-red-600 text-white border-red-600 animate-pulse"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
            title={listening ? "Stop listening" : "Speak question"}
          >
            {listening ? "● Stop" : "🎤"}
          </button>
          <button
            type="submit"
            disabled={busy || !q.trim()}
            className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
