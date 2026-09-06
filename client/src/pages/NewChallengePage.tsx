import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createChallenge } from "../services/api.js";
import { CATEGORIES, DISTRICT_NAMES } from "../constants.js";
import { Card, inputCls, btnPrimary, BackLink } from "../components/UI.js";

type SR = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function NewChallengePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [affectedPopulation, setAffectedPopulation] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [village, setVillage] = useState("");
  const [hasAlternative, setHasAlternative] = useState("");
  const [frequency, setFrequency] = useState("");
  const [vulnerableGroups, setVulnerableGroups] = useState<string[]>([]);
  const [reporterName, setReporterName] = useState("");
  const [reporterType, setReporterType] = useState("Citizen");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState("");

  // Voice speech state
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState("hi-IN");
  const [voiceError, setVoiceError] = useState("");

  const handleToggleVulnerable = (g: string) => {
    setVulnerableGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setLocMsg("Location not supported on this browser.");
      return;
    }
    setLocMsg("Detecting GPS location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocMsg("");
      },
      () => setLocMsg("Could not detect location. District will be used instead."),
      { timeout: 8000 }
    );
  };

  const startVoice = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceError("Voice input is not supported in this browser. You can still type.");
      return;
    }
    const rec = new Ctor();
    rec.lang = voiceLang;
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      const text = Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>).map((r) => r[0].transcript).join(" ");
      setDescription((prev) => (prev ? prev + " " : "") + text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setVoiceError("Voice recognition stopped. Please try again.");
    };
    rec.start();
    setListening(true);
    setVoiceError("");
    (window as unknown as { __rec?: SR }).__rec = rec;
  };

  const stopVoice = () => {
    (window as unknown as { __rec?: SR }).__rec?.stop();
    setListening(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !district) {
      setError("Please fill out Title, Description and District.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await createChallenge({
        title,
        description,
        category: category || undefined,
        affectedPopulation: affectedPopulation ? Number(affectedPopulation) : 0,
        district,
        block,
        village,
        hasAlternative: hasAlternative === "no" ? false : hasAlternative === "yes" ? true : undefined,
        frequency: frequency || undefined,
        vulnerableGroups,
        reporterName: reporterName || "Anonymous",
        reporterType,
        lat: coords?.lat,
        lng: coords?.lng,
      });

      navigate(`/challenges/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/challenges">All challenges</BackLink>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Report a Problem</h1>
        <p className="mt-1 text-sm text-slate-600">
          Describe the problem in your own words — in Hindi, English or a regional language. The platform will classify it, check for similar reports nearby and calculate an explainable priority.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="What is the problem?">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Our village handpump dries up every summer"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="When does it happen, who is affected, what do people do now? Mention if there is no alternative source."
                className={inputCls}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  <option value="hi-IN">Hindi</option>
                  <option value="en-IN">English</option>
                  <option value="bn-IN">Bengali</option>
                  <option value="or-IN">Odia</option>
                </select>
                {listening ? (
                  <button
                    type="button"
                    onClick={stopVoice}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white cursor-pointer"
                  >
                    ● Stop recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoice}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    🎤 Speak instead of typing
                  </button>
                )}
                {voiceError && <p className="w-full text-xs text-amber-700">{voiceError}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category <span className="font-normal text-slate-400">(optional — detected automatically)</span>
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  <option value="">Let the AI decide</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  People affected <span className="font-normal text-slate-400">(estimate)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={affectedPopulation}
                  onChange={(e) => setAffectedPopulation(e.target.value)}
                  placeholder="e.g. 1200"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Where is it?">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select district</option>
                {DISTRICT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Block</label>
              <input value={block} onChange={(e) => setBlock(e.target.value)} className={inputCls} placeholder="e.g. Chainpur" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Village / Ward</label>
              <input value={village} onChange={(e) => setVillage(e.target.value)} className={inputCls} placeholder="e.g. Bhandaria" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={locate}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Use my GPS location
            </button>
            {coords ? (
              <span className="text-emerald-700 font-medium">Tagged: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            ) : (
              <span className="text-slate-500">{locMsg}</span>
            )}
          </div>
        </Card>

        <Card title="Severity details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Is there any alternative source or workaround?</label>
              <select value={hasAlternative} onChange={(e) => setHasAlternative(e.target.value)} className={inputCls}>
                <option value="">Not sure</option>
                <option value="no">No — this is the only option</option>
                <option value="yes">Yes, but inadequate</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">How often does it happen?</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                <option value="">Not sure</option>
                <option value="constant">All the time</option>
                <option value="seasonal">Every season / every year</option>
                <option value="occasional">Occasionally</option>
              </select>
            </div>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-slate-700">Vulnerable groups affected</legend>
            <div className="flex flex-wrap gap-3">
              {["Children", "Women", "Elderly", "Tribal communities", "Persons with disabilities"].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vulnerableGroups.includes(g)}
                    onChange={() => handleToggleVulnerable(g)}
                    className="rounded border-slate-300"
                  />
                  {g}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card title="Who is reporting?">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name / Organisation</label>
              <input
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Gram Panchayat Bhandaria"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Reporting as</label>
              <select value={reporterType} onChange={(e) => setReporterType(e.target.value)} className={inputCls}>
                {["Citizen", "NGO", "Panchayat", "Municipal Body", "Government Department"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {submitting ? "Processing & Clustering with AI..." : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
}
