import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search as SearchIcon, Filter, CheckCircle2, XCircle, AlertTriangle, ChevronDown, SlidersHorizontal, Radar, Sparkles, TrendingUp, Clock, Eye, AlertCircle } from "lucide-react";
import { searchClaimsWithAI, type SearchResult } from "../services/api";

type Verdict = "TRUE" | "FALSE" | "MISLEADING";

// Mini confidence arc component
function ConfidenceArc({ value, color, size = 40 }: { value: number; color: string; size?: number }) {
  const strokeWidth = 3;
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
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 4px ${color}50)` }}
      />
    </svg>
  );
}

export function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedVerdict, setSelectedVerdict] = useState<Verdict | "All">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const placeholders = [
    "Search verified claims...",
    "Is climate change real?",
    "Vaccine safety studies...",
    "Was the moon landing faked?",
    "Search any claim or topic..."
  ];

  // Rotating placeholder
  useEffect(() => {
    if (searched) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searched]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const aiResults = await searchClaimsWithAI(query);
      setResults(aiResults);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message || "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = results.filter(
    result => selectedVerdict === "All" || result.verdict === selectedVerdict
  );

  const highlightText = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[var(--electric-cyan)]/30 text-white px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getVerdictIcon = (verdict: Verdict) => {
    switch (verdict) {
      case "TRUE": return CheckCircle2;
      case "FALSE": return XCircle;
      case "MISLEADING": return AlertTriangle;
    }
  };

  const getVerdictColor = (verdict: Verdict) => {
    switch (verdict) {
      case "TRUE": return "#00FF88";
      case "FALSE": return "var(--crimson)";
      case "MISLEADING": return "var(--amber)";
    }
  };

  const getVerdictGradient = (verdict: Verdict) => {
    switch (verdict) {
      case "TRUE": return "linear-gradient(to bottom, #00FF88, #00FF8830)";
      case "FALSE": return "linear-gradient(to bottom, var(--crimson), rgba(255,45,85,0.2))";
      case "MISLEADING": return "linear-gradient(to bottom, var(--amber), rgba(255,184,0,0.2))";
    }
  };

  // Stats calculation
  const avgConfidence = filteredResults.length > 0
    ? (filteredResults.reduce((s, r) => s + r.confidence, 0) / filteredResults.length).toFixed(0)
    : 0;
  const trueCount = filteredResults.filter(r => r.verdict === "TRUE").length;
  const falseCount = filteredResults.filter(r => r.verdict === "FALSE").length;
  const misleadingCount = filteredResults.filter(r => r.verdict === "MISLEADING").length;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Inject keyframes */}
      <style>{`
        @keyframes searchGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 245, 255, 0.1), inset 0 0 20px rgba(0, 245, 255, 0.02); }
          50% { box-shadow: 0 0 40px rgba(0, 245, 255, 0.2), inset 0 0 30px rgba(0, 245, 255, 0.05); }
        }
        @keyframes radarSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes radarPulse {
          0% { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(-10px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-40px) translateX(20px); opacity: 0; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header — Cinematic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.12)' }}
          >
            <Sparkles size={14} className="text-[var(--electric-cyan)]" />
            <span className="text-xs text-[var(--electric-cyan)] uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>AI-Powered Search</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl mb-4 text-white">Search & Analyze</h1>
          <p className="text-lg text-white/35 max-w-lg mx-auto" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
            Explore our database of verified claims with intelligent filtering
          </p>
        </motion.div>

        {/* ═══════════ CINEMATIC SEARCH BAR ═══════════ */}
        <div className="max-w-4xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            {/* Outer glow container */}
            <div
              className="absolute -inset-1 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(123, 97, 255, 0.1), rgba(0, 245, 255, 0.15))',
                filter: 'blur(12px)',
              }}
            />

            <div
              className="relative flex gap-3 p-2 rounded-2xl transition-all duration-500"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25 group-focus-within:text-[var(--electric-cyan)] transition-colors" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full pl-14 pr-6 py-4 bg-transparent text-white text-lg placeholder-white/25 focus:outline-none transition-all"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, letterSpacing: '0.01em' }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-8 py-4 rounded-xl text-[var(--deep-black)] font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #00F5FF, #00D4FF)',
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: '0 4px 20px rgba(0, 245, 255, 0.25)',
                }}
              >
                {isSearching ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Radar size={18} />
                  </motion.div>
                ) : (
                  <SearchIcon size={18} />
                )}
                {isSearching ? "Scanning..." : "Search"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* ═══════════ ERROR STATE ═══════════ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8 flex items-start gap-4 p-5 rounded-2xl"
            style={{ background: 'rgba(255, 45, 85, 0.05)', border: '1px solid rgba(255, 45, 85, 0.2)' }}
          >
            <AlertCircle size={20} className="text-[#FF2D55] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm font-medium mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Search Failed</p>
              <p className="text-white/40 text-sm" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{error}</p>
            </div>
          </motion.div>
        )}

        {/* ═══════════ SEARCH RESULTS ═══════════ */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Summary Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-3 md:gap-5 mb-8 p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-white/30" />
                  <span className="text-sm text-white/50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <span className="text-white font-mono">{filteredResults.length}</span> results
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10 hidden md:block" />
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-white/30" />
                  <span className="text-sm text-white/50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Avg confidence: <span className="text-[var(--electric-cyan)] font-mono">{avgConfidence}%</span>
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10 hidden md:block" />
                {/* Verdict distribution pills */}
                <div className="flex items-center gap-2">
                  {trueCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00FF88', fontFamily: 'Outfit, sans-serif' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
                      {trueCount} True
                    </span>
                  )}
                  {falseCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(255, 45, 85, 0.1)', color: 'var(--crimson)', fontFamily: 'Outfit, sans-serif' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--crimson)]" />
                      {falseCount} False
                    </span>
                  )}
                  {misleadingCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(255, 184, 0, 0.1)', color: 'var(--amber)', fontFamily: 'Outfit, sans-serif' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
                      {misleadingCount} Misleading
                    </span>
                  )}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* ─── Glass Filter Panel ─── */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    {/* Mobile toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl text-white mb-4 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-[var(--electric-cyan)]" />
                        <span style={{ fontFamily: 'Outfit, sans-serif' }}>Filters</span>
                      </span>
                      <ChevronDown className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`} size={18} />
                    </button>

                    <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl p-6 backdrop-blur-sm"
                        style={{
                          background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                          borderLeft: '2px solid rgba(0, 245, 255, 0.2)',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-5">
                          <SlidersHorizontal size={16} className="text-[var(--electric-cyan)]" />
                          <h3 className="text-base text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Filters</h3>
                        </div>

                        {/* Verdict filters */}
                        <div className="mb-6">
                          <h4 className="text-[10px] text-white/30 mb-3 uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Verdict Type</h4>
                          <div className="space-y-1.5">
                            {(["All", "TRUE", "FALSE", "MISLEADING"] as const).map((verdict) => {
                              const isActive = selectedVerdict === verdict;
                              const verdictColor = verdict === "All" ? "var(--electric-cyan)" : getVerdictColor(verdict as Verdict);
                              const count = verdict === "All" ? results.length : results.filter(r => r.verdict === verdict).length;
                              
                              return (
                                <button
                                  key={verdict}
                                  onClick={() => setSelectedVerdict(verdict)}
                                  className="w-full text-left px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group/btn"
                                  style={{
                                    background: isActive ? `${verdictColor}12` : 'transparent',
                                    border: isActive ? `1px solid ${verdictColor}30` : '1px solid transparent',
                                  }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {/* Indicator dot */}
                                    <div
                                      className="w-2 h-2 rounded-full transition-all"
                                      style={{
                                        backgroundColor: isActive ? verdictColor : 'rgba(255,255,255,0.1)',
                                        boxShadow: isActive ? `0 0 6px ${verdictColor}40` : 'none',
                                      }}
                                    />
                                    <span
                                      className="text-sm transition-colors"
                                      style={{
                                        color: isActive ? verdictColor : 'rgba(255,255,255,0.5)',
                                        fontFamily: 'Outfit, sans-serif',
                                        fontWeight: isActive ? 500 : 400,
                                      }}
                                    >
                                      {verdict === "All" ? "All Results" : verdict.charAt(0) + verdict.slice(1).toLowerCase()}
                                    </span>
                                  </div>
                                  {/* Count badge */}
                                  <span
                                    className="text-[11px] font-mono px-1.5 py-0.5 rounded-md transition-all"
                                    style={{
                                      background: isActive ? `${verdictColor}15` : 'rgba(255,255,255,0.04)',
                                      color: isActive ? verdictColor : 'rgba(255,255,255,0.25)',
                                    }}
                                  >
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Results count */}
                        <div className="pt-4 border-t border-white/5">
                          <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-mono text-[var(--electric-cyan)]" style={{ textShadow: '0 0 20px rgba(0, 245, 255, 0.2)' }}>
                              {filteredResults.length}
                            </div>
                            <div className="text-[11px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>matches</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* ─── Enhanced Result Cards ─── */}
                <div className="lg:col-span-3 space-y-4">
                  {filteredResults.map((result, index) => {
                    const Icon = getVerdictIcon(result.verdict);
                    const verdictColor = getVerdictColor(result.verdict);
                    
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ delay: 0.1 + index * 0.08, duration: 0.5 }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        className="relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer group"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {/* Verdict gradient left border */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                          style={{ background: getVerdictGradient(result.verdict) }}
                        />

                        {/* Hover glow */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(ellipse at 0% 50%, ${verdictColor}08, transparent 50%)`,
                          }}
                        />

                        <div className="relative z-10 flex items-start gap-4 p-6 pl-7">
                          {/* Confidence arc with icon */}
                          <div className="flex-shrink-0 relative group-hover:scale-110 transition-transform duration-300">
                            <ConfidenceArc value={result.confidence} color={verdictColor} size={48} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Icon size={16} style={{ color: verdictColor }} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h3 className="text-[15px] text-white/80 group-hover:text-white transition-colors leading-snug" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400 }}>
                                {highlightText(result.claim)}
                              </h3>
                              <div className="flex-shrink-0 text-right">
                                <div className="text-sm font-mono" style={{ color: verdictColor }}>
                                  {result.confidence}%
                                </div>
                              </div>
                            </div>

                            <p className="text-white/35 text-sm mb-3 leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                              {highlightText(result.snippet)}
                            </p>

                            <div className="flex items-center gap-3">
                              <span
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                style={{
                                  background: `${verdictColor}10`,
                                  color: verdictColor,
                                  border: `1px solid ${verdictColor}20`,
                                  fontFamily: 'Outfit, sans-serif',
                                }}
                              >
                                {result.verdict}
                              </span>
                              <div className="flex items-center gap-1 text-white/20">
                                <Clock size={11} />
                                <span className="text-[11px]" style={{ fontFamily: 'Outfit, sans-serif' }}>{result.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredResults.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20"
                    >
                      <div className="relative inline-block mb-6">
                        <SearchIcon className="w-14 h-14 text-white/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full border border-white/5" style={{ animation: 'radarPulse 2s ease-out infinite' }} />
                        </div>
                      </div>
                      <p className="text-lg text-white/40" style={{ fontFamily: 'Outfit, sans-serif' }}>No results match your filters</p>
                      <p className="text-sm text-white/20 mt-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                        Try adjusting your verdict filter or search query
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ INITIAL EMPTY STATE — Radar Scan ═══════════ */}
        {!searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            {/* Radar animation */}
            <div className="relative inline-block mb-8">
              <div className="relative w-32 h-32">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-white/5" />
                <div className="absolute inset-4 rounded-full border border-white/5" />
                <div className="absolute inset-8 rounded-full border border-white/5" />
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--electric-cyan)]"
                  style={{ boxShadow: '0 0 12px rgba(0, 245, 255, 0.4)' }}
                />
                {/* Sweep line */}
                <div
                  className="absolute top-1/2 left-1/2 w-1/2 h-[1px] origin-left"
                  style={{
                    background: 'linear-gradient(to right, rgba(0, 245, 255, 0.6), transparent)',
                    animation: 'radarSpin 3s linear infinite',
                    transformOrigin: '0% 50%',
                  }}
                />
                {/* Pulse rings */}
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--electric-cyan)]/20"
                    style={{
                      width: '100%',
                      height: '100%',
                      animation: `radarPulse 3s ease-out infinite`,
                      animationDelay: `${i * 1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xl text-white/40 mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400 }}>
              Ready to search
            </p>
            <p className="text-sm text-white/20" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
              Enter a claim or topic to scan our verified database
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
