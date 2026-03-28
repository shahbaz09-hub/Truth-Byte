import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Sparkles, ExternalLink, BookOpen, Fingerprint, ScanLine, Layers, AlertCircle } from "lucide-react";
import { DNAHelix } from "../components/DNAHelix";
import { analyzeClaimWithAI, type ClaimAnalysisResult } from "../services/api";

type Verdict = "TRUE" | "FALSE" | "MISLEADING" | null;

type AnalysisResult = ClaimAnalysisResult;

// Radial confidence meter
function ConfidenceRing({ value, color, size = 120 }: { value: number; color: string; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 10px ${color}50)` }}
      />
    </svg>
  );
}

export function ClaimVerifier() {
  const [claim, setClaim] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingText, setLoadingText] = useState("Scanning sources...");
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!claim.trim()) return;

    setAnalyzing(true);
    setResult(null);
    setError(null);

    const loadingTexts = [
      "Scanning sources...",
      "Cross-referencing databases...",
      "AI analyzing patterns...",
      "Evaluating credibility...",
      "Finalizing verdict..."
    ];

    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[textIndex]);
    }, 1500);

    try {
      const aiResult = await analyzeClaimWithAI(claim);
      clearInterval(textInterval);
      setResult(aiResult);
    } catch (err: any) {
      clearInterval(textInterval);
      setError(err?.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getVerdictColor = (verdict: Verdict) => {
    switch (verdict) {
      case "TRUE": return "#00FF88";
      case "FALSE": return "#FF2D55";
      case "MISLEADING": return "#FFB800";
      default: return "white";
    }
  };

  const getVerdictIcon = (verdict: Verdict) => {
    switch (verdict) {
      case "TRUE": return CheckCircle2;
      case "FALSE": return XCircle;
      case "MISLEADING": return AlertTriangle;
      default: return Shield;
    }
  };

  const getVerdictLabel = (verdict: Verdict) => {
    switch (verdict) {
      case "TRUE": return "Verified True";
      case "FALSE": return "Debunked";
      case "MISLEADING": return "Misleading";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Inject keyframes */}
      <style>{`
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(0, 245, 255, 0.15); }
          50% { border-color: rgba(0, 245, 255, 0.35); }
        }
        @keyframes scanLineV {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(300%); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes typewriter {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes expandRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes floatBubble {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-30px) scale(0.6); opacity: 0; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.12)' }}
          >
            <Fingerprint size={14} className="text-[var(--electric-cyan)]" />
            <span className="text-xs text-[var(--electric-cyan)] uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Fact-Check Engine</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl mb-4 text-white">Verify a Claim</h1>
          <p className="text-lg text-white/35 max-w-lg mx-auto" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>Paste any claim and let our AI determine the truth</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ═══════════ ERROR STATE ═══════════ */}
          {error && !analyzing && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-4 p-5 rounded-2xl"
              style={{ background: 'rgba(255, 45, 85, 0.05)', border: '1px solid rgba(255, 45, 85, 0.2)' }}
            >
              <AlertCircle size={20} className="text-[#FF2D55] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Analysis Failed</p>
                <p className="text-white/40 text-sm" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{error}</p>
              </div>
            </motion.div>
          )}

          {/* ═══════════ INPUT STATE ═══════════ */}
          {!analyzing && !result && (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Cinematic textarea */}
              <div className="relative group">
                {/* Outer glow */}
                <div
                  className="absolute -inset-1 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.12), rgba(123, 97, 255, 0.08), rgba(0, 245, 255, 0.12))',
                    filter: 'blur(15px)',
                  }}
                />
                {/* Scan line inside textarea */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div
                    className="absolute left-0 right-0 h-[1px] opacity-0 group-focus-within:opacity-50"
                    style={{
                      background: 'linear-gradient(to right, transparent, rgba(0, 245, 255, 0.5), transparent)',
                      animation: 'scanLineV 4s ease-in-out infinite',
                    }}
                  />
                </div>

                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Enter a claim to fact-check... (e.g., 'The Earth's population reached 8 billion in 2022')"
                  className="relative w-full h-52 px-7 py-5 bg-transparent rounded-2xl text-white placeholder-white/20 focus:outline-none resize-none text-[15px] leading-relaxed z-10"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 300,
                    transition: 'border-color 0.5s, box-shadow 0.5s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(0, 245, 255, 0.25)';
                    e.target.style.boxShadow = '0 0 40px rgba(0, 245, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Analyze button */}
              <motion.button
                onClick={handleAnalyze}
                disabled={!claim.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4.5 rounded-xl text-[var(--deep-black)] font-medium flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00F5FF, #00D4FF)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  boxShadow: claim.trim() ? '0 8px 30px rgba(0, 245, 255, 0.25)' : 'none',
                }}
              >
                <Sparkles size={18} />
                Analyze Claim
              </motion.button>

              {/* Quick tips */}
              <div className="flex items-center justify-center gap-6 pt-2">
                {[
                  { icon: ScanLine, label: "Real-time analysis" },
                  { icon: Layers, label: "Multi-source" },
                  { icon: BookOpen, label: "Cited results" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-white/15">
                    <tip.icon size={12} />
                    <span className="text-[11px]" style={{ fontFamily: 'Outfit, sans-serif' }}>{tip.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ ANALYZING STATE ═══════════ */}
          {analyzing && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              {/* Enhanced DNA helix with outer rings */}
              <div className="relative">
                <DNAHelix />
                {/* Pulsing rings around helix */}
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--electric-cyan)]"
                    style={{
                      width: `${80 + i * 30}px`,
                      height: `${80 + i * 30}px`,
                      animation: `expandRing 2.5s ease-out infinite`,
                      animationDelay: `${i * 0.6}s`,
                    }}
                  />
                ))}
              </div>

              {/* Loading text with transition */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingText}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-10 text-lg text-[var(--electric-cyan)]"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, letterSpacing: '0.05em' }}
                >
                  {loadingText}
                </motion.p>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="mt-5 flex gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--electric-cyan)' }}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.2, 1, 0.2]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ RESULT STATE ═══════════ */}
          {result && !analyzing && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Hero Verdict Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="relative overflow-hidden rounded-3xl"
                style={{
                  background: `linear-gradient(160deg, ${getVerdictColor(result.verdict)}08, transparent 40%, ${getVerdictColor(result.verdict)}04)`,
                  border: `1px solid ${getVerdictColor(result.verdict)}20`,
                }}
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                  style={{ background: `radial-gradient(circle, ${getVerdictColor(result.verdict)}, transparent 70%)` }}
                />

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                  {/* Confidence ring with verdict icon */}
                  <div className="relative flex-shrink-0">
                    <ConfidenceRing value={result.confidence} color={getVerdictColor(result.verdict)} size={130} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4, type: "spring" }}
                      >
                        {(() => {
                          const Icon = getVerdictIcon(result.verdict);
                          return <Icon size={28} style={{ color: getVerdictColor(result.verdict) }} />;
                        })()}
                      </motion.div>
                      <span className="text-[11px] font-mono text-white/40 mt-1">
                        {result.confidence.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Verdict text */}
                  <div className="text-center md:text-left flex-1">
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl md:text-5xl mb-2"
                      style={{ color: getVerdictColor(result.verdict) }}
                    >
                      {result.verdict}
                    </motion.h2>
                    <p className="text-white/40 text-sm" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                      {getVerdictLabel(result.verdict)} — {result.confidence.toFixed(1)}% confidence score
                    </p>
                  </div>
                </div>

                {/* Particle burst on result reveal */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i / 8) * Math.PI * 2) * 80,
                      y: Math.sin((i / 8) * Math.PI * 2) * 80,
                      opacity: [1, 0.6, 0]
                    }}
                    transition={{ duration: 1.2, delay: 0.6 }}
                    className="absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getVerdictColor(result.verdict) }}
                  />
                ))}
              </motion.div>

              {/* Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderLeft: `2px solid ${getVerdictColor(result.verdict)}30`,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <h3 className="text-base text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Summary</h3>
                <p className="text-white/50 leading-relaxed text-[15px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{result.summary}</p>
              </motion.div>

              {/* Key Findings + Sources — Side by side on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Key Findings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <h3 className="text-base text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
                    <BookOpen size={15} className="text-[var(--electric-cyan)]" />
                    Key Findings
                  </h3>
                  <div className="space-y-3">
                    {result.keyPoints.map((point, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getVerdictColor(result.verdict), boxShadow: `0 0 6px ${getVerdictColor(result.verdict)}40` }} />
                        </div>
                        <span className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{point}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Sources */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <h3 className="text-base text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
                    <ExternalLink size={15} className="text-[var(--electric-cyan)]" />
                    Sources Checked
                  </h3>
                  <div className="space-y-2">
                    {result.sources.map((source, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group"
                        style={{
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-[var(--electric-cyan)]/30" />
                        <span className="text-white/45 text-sm group-hover:text-white/70 transition-colors" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{source}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 pt-2"
              >
                <button
                  onClick={() => {
                    setClaim("");
                    setResult(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Verify Another Claim
                </button>
                <button
                  className="flex-1 py-3.5 rounded-xl text-[var(--deep-black)] font-medium text-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #00F5FF, #00D4FF)',
                    fontFamily: 'Outfit, sans-serif',
                    boxShadow: '0 4px 20px rgba(0, 245, 255, 0.2)',
                  }}
                >
                  Share Result
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
