import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Target, Award, Clock, CheckCircle2, XCircle, AlertTriangle, BarChart3, Activity, Crosshair, Gauge, Flame, Zap } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useNavigate } from "react-router";
import { isAuthenticated, getUserInfo, fetchClaimHistory, ClaimAnalysisResult } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getWeekActivity(records: { createdAt?: string; verdict: string }[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = records.filter(r => r.createdAt && new Date(r.createdAt).getTime() > weekAgo);
  return days.map(day => ({
    date: day,
    claims: recent.filter(r => r.createdAt && new Date(r.createdAt).toLocaleDateString("en-US", { weekday: "short" }) === day).length,
  }));
}

function getMonthAccuracy(records: { createdAt?: string; verdict: string }[]) {
  if (records.length === 0) return [];
  const byMonth: Record<string, { total: number; true: number }> = {};
  records.forEach(r => {
    if (!r.createdAt) return;
    const key = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short" });
    if (!byMonth[key]) byMonth[key] = { total: 0, true: 0 };
    byMonth[key].total++;
    if (r.verdict === "TRUE") byMonth[key].true++;
  });
  return Object.entries(byMonth).slice(-3).map(([month, data]) => ({
    month,
    accuracy: data.total > 0 ? Math.round((data.true / data.total) * 100) : 0,
  }));
}

function getTimeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function RadialProgress({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
      />
    </svg>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<ClaimAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const userName = getUserInfo()?.fullName || "User";

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchClaimHistory()
      .then(data => {
        setVerifications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const totalVerified = verifications.length;
  const thisWeek = verifications.filter(r => r.createdAt && new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
  const trueCount = verifications.filter(r => r.verdict === "TRUE").length;
  const accuracyPct = totalVerified > 0 ? Math.round((trueCount / totalVerified) * 100) : 0;
  const recentClaims = verifications.slice(0, 4);

  const activityData = getWeekActivity(verifications);
  const accuracyData = getMonthAccuracy(verifications);
  const weekSparkData = activityData.map(d => ({ d: d.date.charAt(0), v: d.claims }));

  const getVerdictColor = (verdict: "TRUE" | "FALSE" | "MISLEADING") => {
    switch (verdict) {
      case "TRUE":  return "#00FF88";
      case "FALSE": return "var(--crimson)";
      case "MISLEADING": return "var(--amber)";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(10, 10, 15, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '13px'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2px', fontSize: '11px' }}>{label}</p>
          <p style={{ color: 'white', fontWeight: 500 }}>{payload[0].value} {payload[0].dataKey === 'accuracy' ? '%' : 'claims'}</p>
        </div>
      );
    }
    return null;
  };

  const isEmpty = totalVerified === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        @keyframes matrixDrip {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <p className="text-[var(--electric-cyan)] text-sm uppercase tracking-[0.3em] font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>Dashboard</p>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[11px] text-[#00FF88]" style={{ fontFamily: 'Outfit, sans-serif' }}>Live</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl mb-2 text-white">Welcome back, <span style={{ color: 'var(--electric-cyan)' }}>{userName}</span></h1>
          <p className="text-lg text-white/30" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>Here's your fact-checking activity overview</p>
        </motion.div>

        {/* ═══════════ STAT CARDS ═══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">

          {/* Card 1: Claims Verified */}
          <motion.div
            initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.05, duration: 0.6 }}
            whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0, 245, 255, 0.15)' }}
            className="relative overflow-hidden rounded-3xl p-6 cursor-pointer group"
            style={{
              background: 'linear-gradient(145deg, rgba(0, 245, 255, 0.08) 0%, rgba(0, 245, 255, 0.02) 40%, rgba(10, 10, 15, 0.95) 100%)',
              border: '1px solid rgba(0, 245, 255, 0.12)',
            }}
          >
            <div
              className="absolute left-0 right-0 h-[2px] opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, transparent, #00F5FF, transparent)',
                animation: 'scanLine 3.5s ease-in-out infinite',
              }}
            />
            <div className="absolute top-4 right-4">
              <div className="w-2 h-2 rounded-full bg-[#00F5FF]" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0, 245, 255, 0.15)' }}>
                  <Crosshair size={16} className="text-[#00F5FF]" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-mono text-white mb-1 tracking-tighter" style={{ fontWeight: 300 }}>
                {isEmpty ? "—" : totalVerified}
              </div>
              <div className="text-[10px] text-[#00F5FF]/60 uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Claims Verified
              </div>
            </div>
          </motion.div>

          {/* Card 2: Accuracy Score */}
          <motion.div
            initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.12, duration: 0.6 }}
            whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0, 255, 136, 0.12)' }}
            className="relative overflow-hidden rounded-3xl p-6 cursor-pointer group"
            style={{
              background: 'linear-gradient(160deg, rgba(0, 255, 136, 0.06) 0%, rgba(10, 10, 15, 0.98) 50%)',
              border: '1px solid rgba(0, 255, 136, 0.10)',
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-20 group-hover:opacity-35 transition-opacity duration-700"
              style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }}
            />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <RadialProgress value={isEmpty ? 0 : accuracyPct} color="#00FF88" size={88} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-mono text-white tracking-tight" style={{ fontWeight: 300 }}>
                    {isEmpty ? "—" : `${accuracyPct}%`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Gauge size={12} className="text-[#00FF88]/60" />
                <span className="text-[10px] text-[#00FF88]/60 uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  True Rate
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: This Week */}
          <motion.div
            initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.19, duration: 0.6 }}
            whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(255, 184, 0, 0.12)' }}
            className="relative overflow-hidden rounded-3xl p-6 cursor-pointer group"
            style={{
              background: 'linear-gradient(170deg, rgba(255, 184, 0, 0.05) 0%, rgba(10, 10, 15, 0.98) 60%)',
              borderLeft: '2px solid rgba(255, 184, 0, 0.35)',
              borderTop: '1px solid rgba(255, 184, 0, 0.08)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255, 184, 0, 0.08)', border: '1px solid rgba(255, 184, 0, 0.15)' }}>
                  <Flame size={16} className="text-[#FFB800]" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter" style={{ fontWeight: 300 }}>
                {isEmpty ? "—" : thisWeek}
              </div>
              {!isEmpty && (
                <div className="h-10 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekSparkData} barCategoryGap="20%">
                      <Bar dataKey="v" fill="#FFB800" radius={[2, 2, 0, 0]} opacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="text-[10px] text-[#FFB800]/50 uppercase tracking-[0.2em] mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                This Week
              </div>
            </div>
          </motion.div>

          {/* Card 4: Total FALSE found */}
          <motion.div
            initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.26, duration: 0.6 }}
            whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(123, 97, 255, 0.12)' }}
            className="relative overflow-hidden rounded-3xl p-6 cursor-pointer group"
            style={{
              background: 'linear-gradient(155deg, rgba(123, 97, 255, 0.06) 0%, rgba(10, 10, 15, 0.98) 50%)',
              border: '1px solid rgba(123, 97, 255, 0.10)',
              boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.3)',
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute opacity-[0.06] pointer-events-none font-mono text-[10px] text-[#7B61FF] leading-tight"
                style={{
                  left: `${15 + i * 18}%`,
                  top: 0,
                  animation: `matrixDrip ${2.5 + i * 0.4}s linear infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                {"01001".split("").map((c, j) => <div key={j}>{c}</div>)}
              </div>
            ))}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(123, 97, 255, 0.08)', border: '1px solid rgba(123, 97, 255, 0.15)' }}>
                  <Zap size={16} className="text-[#7B61FF]" />
                </div>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-4xl md:text-5xl font-mono text-white tracking-tighter" style={{ fontWeight: 300, textShadow: '0 0 20px rgba(123, 97, 255, 0.3)' }}>
                  {isEmpty ? "—" : verifications.filter(r => r.verdict === "FALSE").length}
                </span>
                <span className="inline-block w-[2px] h-6 bg-[#7B61FF] ml-1 rounded-full" style={{ animation: 'cursorBlink 1.2s step-end infinite' }} />
              </div>
              <div className="text-[10px] text-[#7B61FF]/50 uppercase tracking-[0.2em] mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Debunked
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        {!isEmpty ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mb-8">
            {/* Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Weekly Activity</h3>
                  <p className="text-xs text-white/25" style={{ fontFamily: 'Outfit, sans-serif' }}>Claims verified per day</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.12)' }}>
                  <Activity size={13} className="text-[var(--electric-cyan)]" />
                  <span className="text-xs text-[var(--electric-cyan)]" style={{ fontFamily: 'Outfit, sans-serif' }}>{thisWeek} this week</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="claimsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Outfit, sans-serif' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Outfit, sans-serif' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 245, 255, 0.15)' }} />
                  <Area type="monotone" dataKey="claims" stroke="#00F5FF" strokeWidth={2} fill="url(#claimsGradient)"
                    dot={{ fill: '#0A0A0F', stroke: '#00F5FF', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#00F5FF', stroke: '#0A0A0F', strokeWidth: 2, r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Accuracy Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderLeft: '2px solid rgba(0, 255, 136, 0.3)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Accuracy Trend</h3>
                  <p className="text-xs text-white/25" style={{ fontFamily: 'Outfit, sans-serif' }}>Monthly verification accuracy</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono text-[#00FF88]">{accuracyPct}%</div>
                  <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Current</div>
                </div>
              </div>
              {accuracyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={accuracyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Outfit, sans-serif' }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Outfit, sans-serif' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 255, 136, 0.15)' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#00FF88" strokeWidth={2.5}
                      dot={{ fill: '#0A0A0F', stroke: '#00FF88', strokeWidth: 2, r: 5 }}
                      activeDot={{ fill: '#00FF88', stroke: '#0A0A0F', strokeWidth: 2, r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/20 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Not enough data yet</p>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-12 mb-8 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.12)' }}>
              <Target size={28} className="text-[var(--electric-cyan)]/50" />
            </div>
            <h3 className="text-xl text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400 }}>No activity yet</h3>
            <p className="text-white/30 text-sm max-w-sm mx-auto" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
              Start verifying claims using the Claim Verifier to see your activity and accuracy stats appear here.
            </p>
          </motion.div>
        )}

        {/* Bottom Section — Recent Claims */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Recent Verifications</h3>
            </div>
            {recentClaims.length > 0 ? (
              <div className="space-y-1">
                {recentClaims.map((claim, index) => {
                  const verdictColor = getVerdictColor(claim.verdict);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.08 }}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all group cursor-pointer"
                    >
                      <div className="flex-shrink-0 relative">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: verdictColor, boxShadow: `0 0 8px ${verdictColor}40` }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-[14px] group-hover:text-white transition-colors truncate">
                          {claim.claimText || claim.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[11px] font-medium hidden sm:block" style={{ color: verdictColor, fontFamily: 'Outfit, sans-serif' }}>
                          {claim.verdict}
                        </span>
                        <span className="text-[11px] text-white/20" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {getTimeAgo(claim.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-white/20 text-sm" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                  No verifications yet — try the Claim Verifier
                </p>
              </div>
            )}
          </motion.div>

          {/* Stats Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl p-6 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(160deg, rgba(0, 245, 255, 0.06), rgba(123, 97, 255, 0.04), transparent)',
              borderTop: '1px solid rgba(0, 245, 255, 0.15)',
              borderLeft: '1px solid rgba(0, 245, 255, 0.08)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 245, 255, 0.1)', border: '1px solid rgba(0, 245, 255, 0.2)' }}>
                  <Award size={18} className="text-[var(--electric-cyan)]" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Stats</div>
                  <div className="text-[var(--electric-cyan)] text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>All time</div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,255,136,0.1)' }}>
                    <div className="text-xl font-mono text-[#00FF88] mb-0.5">{verifications.filter(r => r.verdict === "TRUE").length}</div>
                    <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>True</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,45,85,0.1)' }}>
                    <div className="text-xl font-mono text-[#FF2D55] mb-0.5">{verifications.filter(r => r.verdict === "FALSE").length}</div>
                    <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>False</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,184,0,0.1)' }}>
                    <div className="text-xl font-mono text-[#FFB800] mb-0.5">{verifications.filter(r => r.verdict === "MISLEADING").length}</div>
                    <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Misc.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-white/20">
                <BarChart3 size={14} />
                <span className="text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>Stats update after each verification</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
