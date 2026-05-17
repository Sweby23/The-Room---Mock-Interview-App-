import { useState, useEffect, useRef } from "react";
import Head from "next/head";

// ============================================================
// SHARED STYLE TOKENS
// ============================================================
const COLORS = {
  bg: "#F4EFE6",
  ink: "#1A1818",
  accent: "#C2410C",
  accentDeep: "#9A2F08",
  muted: "#8B7E6B",
  card: "#FFFFFF",
  border: "#E5DDC8",
  pass: "#2E5D2E",
  fail: "#8B1A1A",
  borderline: "#8B6F1A",
};

const FONTS = {
  display: "'Fraunces', 'Times New Roman', serif",
  body: "'DM Sans', system-ui, sans-serif",
};

const STORAGE_KEY = "interview-session";

// ============================================================
// MAIN APP
// ============================================================
export default function InterviewPrepApp() {
  const [screen, setScreen] = useState("setup");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load saved session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        setJobDescription(session.jobDescription || "");
        setCompanyName(session.companyName || "");
        setQuestions(session.questions || []);
        setResponses(session.responses || []);
        setCurrentIdx(session.currentIdx || 0);
        setAssessment(session.assessment || null);
        setScreen(session.screen || "setup");
      }
    } catch (e) {
      // No saved session — fine
    }
    setLoaded(true);
  }, []);

  // Persist whenever key state changes
  useEffect(() => {
    if (!loaded) return;
    const session = {
      jobDescription,
      companyName,
      questions,
      responses,
      currentIdx,
      assessment,
      screen:
        screen === "generating" || screen === "assessing" ? "setup" : screen,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
  }, [
    loaded,
    jobDescription,
    companyName,
    questions,
    responses,
    currentIdx,
    assessment,
    screen,
  ]);

  const startInterview = async () => {
    if (!jobDescription.trim()) {
      setError("Paste a job description first.");
      return;
    }
    setError(null);
    setScreen("generating");
    try {
      const qs = await generateQuestions(jobDescription, companyName);
      setQuestions(qs);
      setResponses(qs.map(() => ""));
      setCurrentIdx(0);
      setAssessment(null);
      setScreen("interview");
    } catch (e) {
      setError(`Couldn't generate questions: ${e.message}`);
      setScreen("setup");
    }
  };

  const submitInterview = async () => {
    setScreen("assessing");
    try {
      const result = await assessInterview(
        jobDescription,
        companyName,
        questions,
        responses
      );
      setAssessment(result);
      setScreen("results");
    } catch (e) {
      setError(
        `Couldn't assess your interview: ${e.message}. Your answers are saved — hit Retry.`
      );
      setScreen("interview");
    }
  };

  const restart = () => {
    setScreen("setup");
    setQuestions([]);
    setResponses([]);
    setCurrentIdx(0);
    setAssessment(null);
    setError(null);
  };

  const clearAll = () => {
    if (!confirm("Clear all saved data and start completely fresh?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setJobDescription("");
    setCompanyName("");
    setQuestions([]);
    setResponses([]);
    setCurrentIdx(0);
    setAssessment(null);
    setError(null);
    setScreen("setup");
  };

  const retryAssessment = () => {
    setError(null);
    submitInterview();
  };

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.muted,
          fontFamily: FONTS.body,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>The Room — Mock Interview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap"
        />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.ink,
          fontFamily: FONTS.body,
        }}
      >
        <div
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            padding: "48px 32px",
          }}
        >
          <Header onClearAll={clearAll} showClear={jobDescription.length > 0} />

          {error && (
            <div
              style={{
                background: "#FBE5DC",
                border: `1px solid ${COLORS.accent}`,
                color: COLORS.accentDeep,
                padding: "14px 16px",
                borderRadius: "4px",
                marginBottom: "24px",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span>{error}</span>
              {error.includes("assess") && screen === "interview" && (
                <button
                  onClick={retryAssessment}
                  style={{
                    background: COLORS.accentDeep,
                    color: COLORS.bg,
                    border: "none",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "2px",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {screen === "setup" && (
            <SetupScreen
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              companyName={companyName}
              setCompanyName={setCompanyName}
              onStart={startInterview}
              hasSavedResults={!!assessment}
              onResumeResults={() => setScreen("results")}
              hasSavedAnswers={
                questions.length > 0 && responses.some((r) => r && r.trim())
              }
              onResumeInterview={() => setScreen("interview")}
            />
          )}

          {screen === "generating" && (
            <LoadingScreen label="Building your interview" />
          )}

          {screen === "interview" && questions.length > 0 && (
            <InterviewScreen
              question={questions[currentIdx]}
              index={currentIdx}
              total={questions.length}
              response={responses[currentIdx] || ""}
              setResponse={(val) => {
                const next = [...responses];
                next[currentIdx] = val;
                setResponses(next);
              }}
              onNext={() => {
                if (currentIdx < questions.length - 1) {
                  setCurrentIdx(currentIdx + 1);
                } else {
                  submitInterview();
                }
              }}
              onPrev={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
              onAbandon={() => setScreen("setup")}
            />
          )}

          {screen === "assessing" && (
            <LoadingScreen label="Hiring manager is reviewing" />
          )}

          {screen === "results" && assessment && (
            <ResultsScreen
              assessment={assessment}
              questions={questions}
              responses={responses}
              onRestart={restart}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// HEADER
// ============================================================
function Header({ onClearAll, showClear }) {
  return (
    <header
      style={{
        marginBottom: "48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.muted,
            marginBottom: "8px",
          }}
        >
          Mock Interview · Saved Session
        </div>
        <h1
          style={{
            fontFamily: FONTS.display,
            fontWeight: 400,
            fontSize: "44px",
            lineHeight: "1.05",
            margin: 0,
            fontVariationSettings: "'opsz' 144",
            letterSpacing: "-0.02em",
          }}
        >
          The <em style={{ fontStyle: "italic", color: COLORS.accent }}>Room.</em>
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: COLORS.muted,
            marginTop: "12px",
            maxWidth: "520px",
          }}
        >
          Paste a job description. Get five honest questions. Answer them out
          loud with the camera on, or type. Receive a verdict with no soft edges.
        </p>
      </div>
      {showClear && (
        <button
          onClick={onClearAll}
          style={{
            background: "transparent",
            color: COLORS.muted,
            border: `1px solid ${COLORS.border}`,
            padding: "8px 14px",
            fontSize: "11px",
            fontFamily: FONTS.body,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: "2px",
            whiteSpace: "nowrap",
            marginTop: "8px",
          }}
        >
          Clear Session
        </button>
      )}
    </header>
  );
}

// ============================================================
// SETUP SCREEN
// ============================================================
function SetupScreen({
  jobDescription,
  setJobDescription,
  companyName,
  setCompanyName,
  onStart,
  hasSavedResults,
  onResumeResults,
  hasSavedAnswers,
  onResumeInterview,
}) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        padding: "40px",
        borderRadius: "2px",
      }}
    >
      {hasSavedResults && (
        <ResumeBanner
          label="You have a saved assessment from a previous session."
          buttonLabel="View Results →"
          onClick={onResumeResults}
        />
      )}
      {!hasSavedResults && hasSavedAnswers && (
        <ResumeBanner
          label="You have an interview in progress with saved answers."
          buttonLabel="Resume Interview →"
          onClick={onResumeInterview}
        />
      )}

      <div style={{ marginBottom: "32px" }}>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.muted,
            marginBottom: "10px",
            fontWeight: 600,
          }}
        >
          Company (optional)
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Ace & Tate"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: "15px",
            fontFamily: FONTS.body,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "2px",
            color: COLORS.ink,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.muted,
            marginBottom: "10px",
            fontWeight: 600,
          }}
        >
          Job description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={10}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "14px",
            fontFamily: FONTS.body,
            lineHeight: "1.6",
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "2px",
            color: COLORS.ink,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <button
        onClick={onStart}
        style={{
          background: COLORS.ink,
          color: COLORS.bg,
          border: "none",
          padding: "16px 32px",
          fontSize: "14px",
          fontFamily: FONTS.body,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          borderRadius: "2px",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.accent)}
        onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.ink)}
      >
        Begin Interview →
      </button>
    </div>
  );
}

function ResumeBanner({ label, buttonLabel, onClick }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        padding: "16px 20px",
        marginBottom: "28px",
        borderRadius: "2px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontSize: "13px", color: COLORS.ink }}>{label}</div>
      <button
        onClick={onClick}
        style={{
          background: COLORS.accent,
          color: COLORS.bg,
          border: "none",
          padding: "10px 18px",
          fontSize: "12px",
          fontFamily: FONTS.body,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: "pointer",
          borderRadius: "2px",
          whiteSpace: "nowrap",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ============================================================
// LOADING SCREEN
// ============================================================
function LoadingScreen({ label }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        padding: "120px 40px",
        textAlign: "center",
        borderRadius: "2px",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: "32px",
          fontStyle: "italic",
          color: COLORS.accent,
        }}
      >
        {label}
        {dots}
      </div>
    </div>
  );
}

// ============================================================
// INTERVIEW SCREEN
// ============================================================
function InterviewScreen({
  question,
  index,
  total,
  response,
  setResponse,
  onNext,
  onPrev,
  onAbandon,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");
  const [cameraError, setCameraError] = useState(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        setCameraError(
          "Camera unavailable. Answer by typing — your text is auto-saved as you go."
        );
      }
    })();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Voice transcription not available in this browser. Try Chrome or Edge, or type your answer."
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    baseTextRef.current = response;

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      setResponse(
        (baseTextRef.current + " " + final + " " + interim)
          .replace(/\s+/g, " ")
          .trim()
      );
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.muted,
            fontWeight: 600,
          }}
        >
          Question {index + 1} of {total}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: "100px",
            height: "2px",
            background: COLORS.border,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${((index + 1) / total) * 100}%`,
              background: COLORS.accent,
              transition: "width 0.3s",
            }}
          />
        </div>
        <button
          onClick={onAbandon}
          style={{
            background: "transparent",
            color: COLORS.muted,
            border: "none",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Back to Setup
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: COLORS.ink,
            borderRadius: "2px",
            overflow: "hidden",
            aspectRatio: "4/3",
            position: "relative",
          }}
        >
          {cameraError ? (
            <div
              style={{
                color: COLORS.bg,
                padding: "24px",
                fontSize: "13px",
                lineHeight: 1.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
              }}
            >
              {cameraError}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          )}
          {listening && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                background: COLORS.accent,
                color: COLORS.bg,
                padding: "4px 10px",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              ● Recording
            </div>
          )}
        </div>

        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            padding: "28px",
            borderRadius: "2px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: COLORS.accent,
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            {question?.category || "Question"}
          </div>
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: "22px",
              lineHeight: "1.3",
              margin: 0,
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            {question?.question}
          </p>
        </div>
      </div>

      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          padding: "20px",
          borderRadius: "2px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLORS.muted,
              fontWeight: 600,
            }}
          >
            Your answer · Auto-saved
          </span>
          <button
            onClick={listening ? stopListening : startListening}
            style={{
              background: listening ? COLORS.accent : "transparent",
              color: listening ? COLORS.bg : COLORS.ink,
              border: `1px solid ${listening ? COLORS.accent : COLORS.ink}`,
              padding: "8px 16px",
              fontSize: "12px",
              fontFamily: FONTS.body,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: "2px",
            }}
          >
            {listening ? "■ Stop" : "🎙 Speak"}
          </button>
        </div>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Speak using the mic, or type here..."
          rows={6}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontFamily: FONTS.body,
            lineHeight: "1.6",
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "2px",
            color: COLORS.ink,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <button
          onClick={onPrev}
          disabled={index === 0}
          style={{
            background: "transparent",
            color: index === 0 ? COLORS.muted : COLORS.ink,
            border: `1px solid ${index === 0 ? COLORS.border : COLORS.ink}`,
            padding: "14px 28px",
            fontSize: "13px",
            fontFamily: FONTS.body,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: index === 0 ? "not-allowed" : "pointer",
            borderRadius: "2px",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!response.trim()}
          style={{
            background: !response.trim() ? COLORS.border : COLORS.ink,
            color: !response.trim() ? COLORS.muted : COLORS.bg,
            border: "none",
            padding: "14px 32px",
            fontSize: "13px",
            fontFamily: FONTS.body,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: !response.trim() ? "not-allowed" : "pointer",
            borderRadius: "2px",
          }}
        >
          {index === total - 1 ? "Submit for Review →" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// RESULTS SCREEN
// ============================================================
function ResultsScreen({ assessment, questions, responses, onRestart }) {
  const verdictColor =
    assessment.verdict === "pass"
      ? COLORS.pass
      : assessment.verdict === "fail"
      ? COLORS.fail
      : COLORS.borderline;

  const verdictLabel =
    assessment.verdict === "pass"
      ? "Offer Likely"
      : assessment.verdict === "fail"
      ? "Not Progressing"
      : "Borderline";

  return (
    <div>
      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          padding: "40px",
          borderRadius: "2px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.muted,
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          The Verdict
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: "56px",
                lineHeight: 1,
                fontWeight: 400,
                color: verdictColor,
                fontStyle: "italic",
                letterSpacing: "-0.02em",
              }}
            >
              {verdictLabel}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: COLORS.muted,
                fontWeight: 600,
              }}
            >
              Overall
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: "48px",
                lineHeight: 1,
                fontWeight: 500,
              }}
            >
              {assessment.overallScore}
              <span style={{ fontSize: "20px", color: COLORS.muted }}>/100</span>
            </div>
          </div>
        </div>
        <p
          style={{
            marginTop: "24px",
            fontSize: "15px",
            lineHeight: 1.6,
            color: COLORS.ink,
            borderTop: `1px solid ${COLORS.border}`,
            paddingTop: "20px",
          }}
        >
          {assessment.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <FeedbackList
          title="What Worked"
          items={assessment.strengths}
          accent={COLORS.pass}
        />
        <FeedbackList
          title="What Cost You"
          items={assessment.weaknesses}
          accent={COLORS.fail}
        />
      </div>

      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          padding: "32px",
          borderRadius: "2px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.muted,
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          Per-Question Breakdown
        </div>
        {assessment.perQuestion.map((pq, i) => (
          <div
            key={i}
            style={{
              padding: "20px 0",
              borderBottom:
                i < assessment.perQuestion.length - 1
                  ? `1px solid ${COLORS.border}`
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "10px",
                gap: "20px",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "17px",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {questions[i]?.question}
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "24px",
                  fontWeight: 600,
                  color:
                    pq.score >= 7
                      ? COLORS.pass
                      : pq.score >= 5
                      ? COLORS.borderline
                      : COLORS.fail,
                  whiteSpace: "nowrap",
                }}
              >
                {pq.score}
                <span style={{ fontSize: "13px", color: COLORS.muted }}>
                  /10
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: COLORS.muted,
                margin: "8px 0 12px",
                fontStyle: "italic",
              }}
            >
              Your answer: "{(responses[i] || "").slice(0, 200)}
              {(responses[i] || "").length > 200 ? "…" : ""}"
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: COLORS.ink,
                margin: 0,
              }}
            >
              {pq.feedback}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        style={{
          background: COLORS.ink,
          color: COLORS.bg,
          border: "none",
          padding: "16px 32px",
          fontSize: "14px",
          fontFamily: FONTS.body,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          borderRadius: "2px",
        }}
      >
        Run Another Interview →
      </button>
    </div>
  );
}

function FeedbackList({ title, items, accent }) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        padding: "24px",
        borderRadius: "2px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: accent,
          fontWeight: 700,
          marginBottom: "14px",
        }}
      >
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {(items || []).map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              padding: "8px 0",
              borderBottom:
                i < items.length - 1 ? `1px solid ${COLORS.border}` : "none",
              color: COLORS.ink,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// JSON extraction — robust to extra text or fenced code
// ============================================================
function extractJSON(text, expectArray = false) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const openChar = expectArray ? "[" : "{";
  const closeChar = expectArray ? "]" : "}";
  const start = cleaned.indexOf(openChar);
  const end = cleaned.lastIndexOf(closeChar);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Response missing valid JSON");
  }
  const jsonStr = cleaned.substring(start, end + 1);
  return JSON.parse(jsonStr);
}

// ============================================================
// API CALLS — now go through our own serverless functions
// ============================================================
async function generateQuestions(jobDescription, companyName) {
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription, companyName }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content.map((b) => b.text || "").join("");
  return extractJSON(text, true);
}

async function assessInterview(jobDescription, companyName, questions, responses) {
  const response = await fetch("/api/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription, companyName, questions, responses }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content.map((b) => b.text || "").join("");
  return extractJSON(text, false);
}
