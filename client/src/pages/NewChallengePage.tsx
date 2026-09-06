import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createChallenge } from "../services/api.js";
import { CATEGORIES, DISTRICT_NAMES } from "../constants.js";
import { Card, inputCls, btnPrimary, BackLink } from "../components/UI.js";

const VOICE_LANGUAGES = [
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "en-IN", label: "English (India)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "or-IN", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "ur-IN", label: "اردو (Urdu)" },
];

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

  // Speech Recognition state
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [voiceLang, setVoiceLang] = useState("hi-IN");
  const [voiceError, setVoiceError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio Note Recording state (MediaRecorder fallback & voice note)
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState(0);
  const [audioNoteUrl, setAudioNoteUrl] = useState<string | null>(null);

  // AI categorization animation state
  const [aiStage, setAiStage] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

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

  const startAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const render = () => {
        if (!isListeningRef.current && !mediaRecorderRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(render);
      };
      render();
    } catch (e) {
      console.warn("Audio meter could not be initialized:", e);
    }
  };

  const startVoice = async () => {
    setVoiceError("");
    setInterimText("");

    const w = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError(
        "Live speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or record a Voice Note below."
      );
      return;
    }

    // Explicitly prompt for mic permission via getUserMedia
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        startAudioVisualizer(stream);
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setVoiceError(
            "Microphone permission denied. Please click the lock or microphone icon in your browser URL address bar to allow microphone access."
          );
          return;
        }
        console.warn("getUserMedia error:", err);
      }
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = voiceLang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      isListeningRef.current = true;
      setListening(true);

      rec.onresult = (e: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const res = e.results[i];
          const text = res[0]?.transcript || "";
          if (res.isFinal) {
            finalChunk += text;
          } else {
            interimChunk += text;
          }
        }

        if (finalChunk.trim()) {
          setDescription((prev) => {
            const p = prev.trim();
            const f = finalChunk.trim();
            return p ? `${p} ${f}` : f;
          });
        }

        setInterimText(interimChunk);
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
        if (e.error === "no-speech") {
          // Normal pause in speech, keep listening
          return;
        }
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setVoiceError(
            "Microphone access blocked. Please allow microphone permissions in your browser URL bar."
          );
          stopVoice();
          return;
        }
        if (e.error === "network") {
          setVoiceError(
            "Speech recognition network service error. Check your internet connection or try recording a Voice Note below."
          );
          stopVoice();
          return;
        }
        if (e.error === "audio-capture") {
          setVoiceError("No microphone found. Please connect an audio input device.");
          stopVoice();
          return;
        }
        if (e.error !== "aborted") {
          setVoiceError(`Voice recognition notification (${e.error}). Please click to speak again.`);
        }
      };

      rec.onend = () => {
        if (isListeningRef.current) {
          try {
            rec.start();
          } catch {
            // Already active or stopped
          }
        } else {
          setListening(false);
          setInterimText("");
          setAudioLevel(0);
        }
      };

      rec.start();
    } catch (err: any) {
      console.error("Speech recognition startup error:", err);
      setVoiceError("Could not start speech recognition. Please verify your microphone permissions.");
      stopVoice();
    }
  };

  const stopVoice = () => {
    isListeningRef.current = false;
    setListening(false);
    setInterimText("");
    setAudioLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  const startAudioNoteRecording = async () => {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      startAudioVisualizer(stream);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAudioNoteUrl(base64data);
          if (!description.trim()) {
            setDescription(`[Voice Note Recorded - ${audioRecordingTime}s audio description attached]`);
          }
        };
        reader.readAsDataURL(audioBlob);

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setRecordingAudio(false);
        setAudioLevel(0);
      };

      recorder.start(500);
      setRecordingAudio(true);
      setAudioRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setAudioRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Audio recording error:", err);
      setVoiceError("Could not access microphone for audio recording. Please allow microphone permissions.");
      setRecordingAudio(false);
    }
  };

  const stopAudioNoteRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopVoice();
      stopAudioNoteRecording();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !district) {
      setError("Please fill out Title, Description and District.");
      return;
    }

    setSubmitting(true);
    setAiStage(1);
    setError("");

    const t1 = setTimeout(() => setAiStage(2), 650);
    const t2 = setTimeout(() => setAiStage(3), 1350);
    const t3 = setTimeout(() => setAiStage(4), 2050);
    const minAnimPromise = new Promise((resolve) => setTimeout(resolve, 2600));

    try {
      const attachmentsList = audioNoteUrl ? [audioNoteUrl] : [];
      const [created] = await Promise.all([
        createChallenge({
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
          attachments: attachmentsList,
        }),
        minAnimPromise,
      ]);

      setAiStage(5);
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (created && created.duplicateLinked) {
        navigate(`/challenges/${created.id}`, {
          state: {
            duplicateLinked: true,
            message: `A matching problem in ${district} was already reported. Your report has been linked to it as an upvote (total upvotes: ${created.upvotes || 1}).`,
          },
        });
      } else {
        navigate(`/challenges/${created.id}`);
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setError(err.message || "Failed to submit challenge.");
      setSubmitting(false);
      setAiStage(0);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* AI Categorization & Triage Processing Modal */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-base shadow-md">
                  ✨
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">JanaSetu AI Triage Engine</h3>
                  <p className="text-xs text-slate-500">Categorization & spatial deduplication</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                {aiStage >= 5 ? "Complete" : "Analyzing"}
              </span>
            </div>

            {/* Glowing AI Radar Box */}
            <div className="rounded-xl bg-slate-950 p-5 text-center text-white relative overflow-hidden border border-slate-800 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 animate-pulse"></div>
              <div className="relative z-10 space-y-2">
                <div className="text-3xl transition-transform duration-300">
                  {aiStage === 1 ? "🔍" : aiStage === 2 ? "🏷️" : aiStage === 3 ? "📡" : aiStage === 4 ? "⚖️" : "✅"}
                </div>
                <div className="text-sm font-semibold tracking-wide text-emerald-400">
                  {aiStage === 1 && "Parsing citizen complaint & language cues..."}
                  {aiStage === 2 && "Categorizing into civic problem domain..."}
                  {aiStage === 3 && `Scanning 100m radius in ${district || "district"} for duplicates...`}
                  {aiStage === 4 && "Computing explainable priority & university matches..."}
                  {aiStage >= 5 && "Categorization & routing complete!"}
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 italic max-w-xs mx-auto">
                  "{title}"
                </p>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  aiStage > 1 ? "bg-emerald-100 text-emerald-700" : aiStage === 1 ? "bg-emerald-600 text-white shadow-sm animate-pulse" : "bg-slate-100 text-slate-400"
                }`}>
                  {aiStage > 1 ? "✓" : "1"}
                </span>
                <span className={aiStage >= 1 ? "font-medium text-slate-800" : "text-slate-400"}>
                  Natural language extraction & urgency detection
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  aiStage > 2 ? "bg-emerald-100 text-emerald-700" : aiStage === 2 ? "bg-emerald-600 text-white shadow-sm animate-pulse" : "bg-slate-100 text-slate-400"
                }`}>
                  {aiStage > 2 ? "✓" : "2"}
                </span>
                <span className={aiStage >= 2 ? "font-medium text-slate-800" : "text-slate-400"}>
                  Domain & sub-tag classification ({category || "AI Auto-detect"})
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  aiStage > 3 ? "bg-emerald-100 text-emerald-700" : aiStage === 3 ? "bg-emerald-600 text-white shadow-sm animate-pulse" : "bg-slate-100 text-slate-400"
                }`}>
                  {aiStage > 3 ? "✓" : "3"}
                </span>
                <span className={aiStage >= 3 ? "font-medium text-slate-800" : "text-slate-400"}>
                  Spatial 100m deduplication scan in {district || "area"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  aiStage > 4 ? "bg-emerald-100 text-emerald-700" : aiStage === 4 ? "bg-emerald-600 text-white shadow-sm animate-pulse" : "bg-slate-100 text-slate-400"
                }`}>
                  {aiStage > 4 ? "✓" : "4"}
                </span>
                <span className={aiStage >= 4 ? "font-medium text-slate-800" : "text-slate-400"}>
                  Priority scoring & partner university matching
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, aiStage * 25)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>AI triage progress</span>
                <span className="font-medium text-emerald-600">{Math.min(100, aiStage * 25)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="mt-2.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {/* Language Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Language:</span>
                    <select
                      value={voiceLang}
                      onChange={(e) => {
                        setVoiceLang(e.target.value);
                        if (listening) {
                          stopVoice();
                        }
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                    >
                      {VOICE_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech to Text Button */}
                  {listening ? (
                    <button
                      type="button"
                      onClick={stopVoice}
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-red-700 cursor-pointer animate-pulse transition-all"
                    >
                      <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                      ● Stop Speech-to-Text
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoice}
                      disabled={recordingAudio}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <span>🎤</span> Speak instead of typing
                    </button>
                  )}

                  {/* Separator */}
                  <span className="text-slate-300 hidden sm:inline">|</span>

                  {/* Audio Note Recorder */}
                  {recordingAudio ? (
                    <button
                      type="button"
                      onClick={stopAudioNoteRecording}
                      className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-all"
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                      ■ Stop Voice Note ({Math.floor(audioRecordingTime / 60)}:{(audioRecordingTime % 60).toString().padStart(2, "0")})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startAudioNoteRecording}
                      disabled={listening}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <span>🎙️</span> Record Voice Note
                    </button>
                  )}
                </div>

                {/* Live Speech Recognition Feedback Bar */}
                {listening && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-950 shadow-2xs transition-all">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </span>
                      <span className="font-semibold text-emerald-800">
                        Listening ({VOICE_LANGUAGES.find((l) => l.code === voiceLang)?.label}):
                      </span>
                      <span className="italic text-slate-800">
                        {interimText || "Speak into your microphone… words will appear in the box"}
                      </span>
                    </div>

                    {/* Audio Level Equalizer */}
                    <div className="flex items-end gap-0.5 h-4 px-1" title="Microphone sound level">
                      <span
                        className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(16, audioLevel * 0.16))}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(16, audioLevel * 0.22))}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(16, audioLevel * 0.14))}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(16, audioLevel * 0.2))}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(16, audioLevel * 0.12))}px` }}
                      />
                    </div>
                  </div>
                )}

                {/* Recorded Audio Preview */}
                {audioNoteUrl && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <span>🎵 Voice Note attached</span>
                      <audio controls src={audioNoteUrl} className="h-7 w-56" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAudioNoteUrl(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 cursor-pointer font-medium"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {voiceError && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 flex items-start gap-1.5">
                    <span className="font-bold">⚠️</span>
                    <span>{voiceError}</span>
                  </div>
                )}
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
