import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, AlertCircle, ExternalLink, Shield, TrendingUp, Eye, ScanLine, Crosshair, BarChart3 } from "lucide-react";
import { analyzeURLWithAI, type URLAnalysisResult } from "../services/api";

type BiasAnalysis = URLAnalysisResult;

// Score ring component
function ScoreRing({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
      />
    </svg>
  );
}

export function URLAnalyzer() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<BiasAnalysis | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadingSteps = [
    { text: "Fetching article content...", icon: Globe },
    { text: "Analyzing language patterns...", icon: ScanLine },
    { text: "Detecting bias indicators...", icon: Eye },
    { text: "Computing credibility score...", icon: Shield },
  ];

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setLoadingPhase(0);
    setResult(null);
    setError(null);

    // Animate through loading phases while API call runs
    let phase = 0;
    const phaseInterval = setInterval(() => {
      phase = Math.min(phase + 1, loadingSteps.length - 1);
      setLoadingPhase(phase);
    }, 900);

    try {
      const aiResult = await analyzeURLWithAI(url);
      clearInterval(phaseInterval);
      setLoadingPhase(loadingSteps.length - 1);
      setResult(aiResult);
    } catch (err: any) {
      clearInterval(phaseInterval);
      setError(err?.message || "Analysis failed. Please check your API key and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getBiasLabel = (bias: number) => {
    if (bias < -40) return "Left Leaning";
    if (bias < -15) return "Slightly Left";
    if (bias < 15) return "Center";
    if (bias < 40) return "Slightly Right";
    return "Right Leaning";
  };

  const getBiasColor = (bias: number) => {
    const abs = Math.abs(bias);
    if (abs < 15) return "#00FF88";
    if (abs < 40) return "#FFB800";
    return "#FF2D55";
  };

  const getCredColor = (score: number) => {
    if (score >= 80) return "#00FF88";
    if (score >= 60) return "#FFB800";
    return "#FF2D55";
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes urlScanLine {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        @keyframes biasNeedle {
          0% { left: 50%; }
        }
        @keyframes wordGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(255, 45, 85, 0); }
          50% { box-shadow: 0 0 15px rgba(255, 45, 85, 0.15); }
        }
        @keyframes progressFill {
          0% { width: 0%; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
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
            style={{ background: 'rgba(123, 97, 255, 0.08)', border: '1px solid rgba(123, 97, 255, 0.15)' }}
          >
            <Crosshair size={14} className="text-[#7B61FF]" />
            <span className="text-xs text-[#7B61FF] uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Bias Scanner</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl mb-4 text-white">URL Analyzer</h1>
          <p className="text-lg text-white/35 max-w-lg mx-auto" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
            Detect bias and analyze article credibility in real-time
          </p>
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

          {/* ═══════════ INPUT / LOADING ═══════════ */}
          {!result && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* URL Input */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative group"
              >
                {/* Glow */}
                <div className="absolute -inset-1 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.12), rgba(0, 245, 255, 0.08))', filter: 'blur(12px)' }}
                />
                <div className="relative flex gap-3 p-2 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex-1 relative">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#7B61FF] transition-colors" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                      placeholder="https://example.com/article"
                      className="w-full pl-14 pr-6 py-4 bg-transparent text-white text-lg placeholder-white/20 focus:outline-none"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}
                    />
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={!url.trim() || analyzing}
                    className="px-8 py-4 rounded-xl text-[var(--deep-black)] font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #7B61FF, #6B51EF)',
                      fontFamily: 'Outfit, sans-serif',
                      boxShadow: '0 4px 20px rgba(123, 97, 255, 0.25)',
                    }}
                  >
                    {analyzing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <ScanLine size={18} />
                      </motion.div>
                    ) : (
                      <Globe size={18} />
                    )}
                    {analyzing ? "Scanning..." : "Analyze"}
                  </button>
                </div>
              </motion.div>

              {/* Loading steps */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md mx-auto space-y-3"
                >
                  {loadingSteps.map((step, i) => {
                    const StepIcon = step.icon;
                    const isActive = i === loadingPhase;
                    const isDone = i < loadingPhase;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                        style={{
                          background: isActive ? 'rgba(123, 97, 255, 0.06)' : 'transparent',
                          border: isActive ? '1px solid rgba(123, 97, 255, 0.15)' : '1px solid transparent',
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isDone ? 'rgba(0, 255, 136, 0.1)' : isActive ? 'rgba(123, 97, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                          }}
                        >
                          {isDone ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Shield size={13} className="text-[#00FF88]" />
                            </motion.div>
                          ) : (
                            <StepIcon size={13} className={isActive ? "text-[#7B61FF]" : "text-white/15"} />
                          )}
                        </div>
                        <span className="text-sm" style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: isActive ? 400 : 300,
                          color: isDone ? 'rgba(0, 255, 136, 0.6)' : isActive ? '#7B61FF' : 'rgba(255,255,255,0.2)',
                        }}>
                          {step.text}
                        </span>
                        {isActive && (
                          <motion.div
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7B61FF]"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══════════ RESULTS ═══════════ */}
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Article Preview + Credibility Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl"
                style={{
                  background: `linear-gradient(160deg, ${getCredColor(result.credibilityScore)}06, transparent 50%)`,
                  border: `1px solid ${getCredColor(result.credibilityScore)}15`,
                }}
              >
                <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                  {/* Credibility ring */}
                  <div className="relative flex-shrink-0">
                    <ScoreRing value={result.credibilityScore} color={getCredColor(result.credibilityScore)} size={100} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-mono text-white" style={{ fontWeight: 300 }}>
                        {result.credibilityScore.toFixed(0)}
                      </span>
                      <span className="text-[9px] text-white/30 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Score</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <Globe size={14} className="text-[#7B61FF]" />
                      <span className="text-[11px] text-white/25 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{result.url}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl text-white mb-2">{result.title}</h3>
                    <span
                      className="inline-block px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${getCredColor(result.credibilityScore)}10`,
                        color: getCredColor(result.credibilityScore),
                        border: `1px solid ${getCredColor(result.credibilityScore)}20`,
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {result.credibilityScore >= 80 ? "High Credibility" : result.credibilityScore >= 60 ? "Moderate Credibility" : "Low Credibility"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Political Bias Spectrum */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl p-7"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={16} className="text-white/30" />
                  <h3 className="text-base text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Political Bias Spectrum</h3>
                </div>

                {/* Spectrum bar */}
                <div className="relative h-3 rounded-full overflow-hidden mb-3">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #3B82F6, rgba(255,255,255,0.15), #EF4444)' }} />
                  {/* Needle */}
                  <motion.div
                    initial={{ left: "50%" }}
                    animate={{ left: `${((result.politicalBias + 100) / 200) * 100}%` }}
                    transition={{ type: "spring", duration: 1.2 }}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-lg" style={{ boxShadow: '0 0 15px rgba(255,255,255,0.5)' }}>
                      <div className="w-2 h-2 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </motion.div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-xs text-blue-400" style={{ fontFamily: 'Outfit, sans-serif' }}>Left</span>
                  <span className="text-xs font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: getBiasColor(result.politicalBias) }}>
                    {getBiasLabel(result.politicalBias)}
                  </span>
                  <span className="text-xs text-red-400" style={{ fontFamily: 'Outfit, sans-serif' }}>Right</span>
                </div>

                {/* Bias stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-2xl font-mono text-white mb-0.5">{Math.abs(result.politicalBias).toFixed(0)}</div>
                    <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Bias Score</div>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-lg font-mono mb-0.5" style={{ color: getBiasColor(result.politicalBias) }}>
                      {getBiasLabel(result.politicalBias)}
                    </div>
                    <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Classification</div>
                  </div>
                </div>
              </motion.div>

              {/* Content Analysis — Fact vs Opinion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl p-7"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderLeft: '2px solid rgba(0, 245, 255, 0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Eye size={16} className="text-[var(--electric-cyan)]" />
                  <h3 className="text-base text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Content Analysis</h3>
                </div>

                <div className="space-y-5">
                  {/* Factual */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/50" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>Factual Content</span>
                      <span className="text-[var(--electric-cyan)] font-mono text-lg">{result.factOpinionRatio.fact.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.factOpinionRatio.fact}%` }}
                        transition={{ duration: 1.2, delay: 0.4 }}
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(to right, #00F5FF, #00D4FF)',
                          boxShadow: '0 0 15px rgba(0, 245, 255, 0.3)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Opinion */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/50" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>Opinion Content</span>
                      <span className="text-[var(--amber)] font-mono text-lg">{result.factOpinionRatio.opinion.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.factOpinionRatio.opinion}%` }}
                        transition={{ duration: 1.2, delay: 0.6 }}
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(to right, #FFB800, #FF9500)',
                          boxShadow: '0 0 15px rgba(255, 184, 0, 0.3)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Manipulative Language */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl p-7"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle size={16} className="text-[var(--crimson)]" />
                  <h3 className="text-base text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Manipulative Language Detected</h3>
                  <span className="ml-auto px-2 py-0.5 rounded-md text-[11px] font-mono"
                    style={{ background: 'rgba(255, 45, 85, 0.1)', color: 'var(--crimson)' }}>
                    {result.manipulativeWords.length} found
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {result.manipulativeWords.map((word, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="relative px-4 py-2.5 rounded-xl text-sm text-white/80 cursor-default"
                      style={{
                        background: 'rgba(255, 45, 85, 0.06)',
                        border: '1px solid rgba(255, 45, 85, 0.15)',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 300,
                        animation: `wordGlow 3s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                      }}
                    >
                      "{word}"
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 pt-2"
              >
                <button
                  onClick={() => { setUrl(""); setResult(null); }}
                  className="flex-1 py-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Analyze Another URL
                </button>
                <button
                  className="flex-1 py-3.5 rounded-xl text-[var(--deep-black)] font-medium text-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #7B61FF, #6B51EF)',
                    fontFamily: 'Outfit, sans-serif',
                    boxShadow: '0 4px 20px rgba(123, 97, 255, 0.2)',
                  }}
                >
                  Download Report
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
