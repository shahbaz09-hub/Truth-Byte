import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Masonry from "react-responsive-masonry";
import { Filter, CheckCircle2, XCircle, Clock, TrendingUp, MessageSquare, Users, ArrowUp, Sparkles, SlidersHorizontal, Globe2, AlertCircle, RefreshCw } from "lucide-react";
import { fetchTrendingReportsWithAI, type CommunityReport, type CommunityCategory } from "../services/api";

type Status = "PENDING" | "VERIFIED" | "FAKE";
type Category = CommunityCategory | "All";

export function CommunityReports() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [selectedStatus, setSelectedStatus] = useState<Status | "All">("All");
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: Category[] = ["All", "Health", "Politics", "Finance", "Tech"];

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingReportsWithAI();
      setReports(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load reports. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const categoryMatch = selectedCategory === "All" || report.category === selectedCategory;
    const statusMatch = selectedStatus === "All" || report.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "VERIFIED": return CheckCircle2;
      case "FAKE": return XCircle;
      case "PENDING": return Clock;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "VERIFIED": return "#00FF88";
      case "FAKE": return "#FF2D55";
      case "PENDING": return "#FFB800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Health": return "#00FF88";
      case "Politics": return "#7B61FF";
      case "Finance": return "#FFB800";
      case "Tech": return "#00F5FF";
      default: return "#ffffff";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Health": return "🏥";
      case "Politics": return "🏛️";
      case "Finance": return "📈";
      case "Tech": return "🔬";
      default: return "🌐";
    }
  };

  // Real computed stats from loaded reports
  const totalReports = reports.length;
  const verifiedCount = reports.filter(r => r.status === "VERIFIED").length;
  const verifiedRate = totalReports > 0 ? Math.round((verifiedCount / totalReports) * 100) : 0;
  const totalVotes = reports.reduce((s, r) => s + r.votes, 0);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes voteGlow {
          0%, 100% { text-shadow: none; }
          50% { text-shadow: 0 0 10px rgba(0, 245, 255, 0.3); }
        }
        @keyframes cardShine {
          0% { transform: translateX(-100%) rotate(-15deg); }
          100% { transform: translateX(200%) rotate(-15deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(0, 255, 136, 0.06)', border: '1px solid rgba(0, 255, 136, 0.12)' }}
          >
            <Globe2 size={14} className="text-[#00FF88]" />
            <span className="text-xs text-[#00FF88] uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Community Hub</span>
          </motion.div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl md:text-6xl mb-3 text-white">Community Reports</h1>
              <p className="text-lg text-white/35" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>AI-detected trending misinformation claims</p>
            </div>
            <button
              onClick={loadReports}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/50 hover:text-white transition-colors mt-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span className="text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-start gap-4 p-5 rounded-2xl"
            style={{ background: 'rgba(255, 45, 85, 0.05)', border: '1px solid rgba(255, 45, 85, 0.2)' }}
          >
            <AlertCircle size={20} className="text-[#FF2D55] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 text-sm font-medium mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Failed to load reports</p>
              <p className="text-white/40 text-sm" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <div className="relative inline-block mb-6">
              <div className="w-14 h-14 rounded-full border-2 border-[#00FF88]/20 border-t-[#00FF88]" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <p className="text-lg text-white/40" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
              Scanning trending misinformation...
            </p>
          </motion.div>
        )}

        {/* Content — only show when loaded */}
        {!loading && !error && (
          <>
            {/* Hero Stats — computed from real AI data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-3 gap-4 md:gap-5 mb-10"
            >
              {/* Total Reports */}
              <motion.div
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-2xl p-5 text-center group cursor-default"
                style={{
                  background: 'linear-gradient(160deg, rgba(0, 245, 255, 0.05), transparent 60%)',
                  border: '1px solid rgba(0, 245, 255, 0.08)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: 'linear-gradient(to right, #00F5FF, transparent)' }} />
                <Users className="w-5 h-5 mx-auto mb-2 text-[#00F5FF]/50" />
                <div className="text-2xl md:text-3xl font-mono text-white mb-0.5" style={{ fontWeight: 300 }}>{totalReports}</div>
                <div className="text-[10px] text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Reports Loaded</div>
              </motion.div>

              {/* Total Votes */}
              <motion.div
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-2xl p-5 text-center cursor-default"
                style={{
                  background: 'linear-gradient(160deg, rgba(255, 184, 0, 0.05), transparent 60%)',
                  border: '1px solid rgba(255, 184, 0, 0.08)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: 'linear-gradient(to right, #FFB800, transparent)' }} />
                <MessageSquare className="w-5 h-5 mx-auto mb-2 text-[#FFB800]/50" />
                <div className="text-2xl md:text-3xl font-mono text-white mb-0.5" style={{ fontWeight: 300 }}>
                  {totalVotes >= 1000 ? `${(totalVotes / 1000).toFixed(1)}K` : totalVotes}
                </div>
                <div className="text-[10px] text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Community Votes</div>
              </motion.div>

              {/* Verified Rate */}
              <motion.div
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-2xl p-5 text-center cursor-default"
                style={{
                  background: 'linear-gradient(160deg, rgba(0, 255, 136, 0.05), transparent 60%)',
                  border: '1px solid rgba(0, 255, 136, 0.08)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: 'linear-gradient(to right, #00FF88, transparent)' }} />
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-[#00FF88]/50" />
                <div className="text-2xl md:text-3xl font-mono text-white mb-0.5" style={{ fontWeight: 300 }}>{verifiedRate}%</div>
                <div className="text-[10px] text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Verified Rate</div>
              </motion.div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex flex-col md:flex-row gap-6 md:gap-10 p-5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Category */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal size={12} className="text-white/20" />
                  <span className="text-[10px] text-white/25 uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Category</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isActive = selectedCategory === category;
                    const catColor = getCategoryColor(category);
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="px-4 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        style={{
                          background: isActive ? `${catColor}10` : 'transparent',
                          border: isActive ? `1px solid ${catColor}25` : '1px solid rgba(255,255,255,0.06)',
                          color: isActive ? catColor : 'rgba(255,255,255,0.4)',
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        <span className="text-xs">{getCategoryIcon(category)}</span>
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-white/25 uppercase tracking-[0.2em]" style={{ fontFamily: 'Outfit, sans-serif' }}>Status</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["All", "PENDING", "VERIFIED", "FAKE"] as const).map((status) => {
                    const isActive = selectedStatus === status;
                    const sColor = status === "All" ? "#00F5FF" : getStatusColor(status as Status);
                    return (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className="px-4 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        style={{
                          background: isActive ? `${sColor}10` : 'transparent',
                          border: isActive ? `1px solid ${sColor}25` : '1px solid rgba(255,255,255,0.06)',
                          color: isActive ? sColor : 'rgba(255,255,255,0.4)',
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {status !== "All" && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? sColor : 'rgba(255,255,255,0.15)' }} />
                        )}
                        {status === "All" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Report Cards */}
            <AnimatePresence mode="wait">
              <motion.div key={`${selectedCategory}-${selectedStatus}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Masonry columnsCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 2 : 3} gutter="1rem">
                  {filteredReports.map((report, index) => {
                    const StatusIcon = getStatusIcon(report.status);
                    const statusColor = getStatusColor(report.status);
                    const categoryColor = getCategoryColor(report.category);
                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 25, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ delay: index * 0.07, duration: 0.5 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group cursor-pointer"
                        style={{
                          background: `linear-gradient(170deg, ${statusColor}04, transparent 40%)`,
                          borderLeft: `2px solid ${statusColor}30`,
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          borderRight: '1px solid rgba(255,255,255,0.05)',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {/* Top row */}
                        <div className="relative z-10 flex items-center justify-between mb-4">
                          <span
                            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium"
                            style={{ color: categoryColor, fontFamily: 'Outfit, sans-serif' }}
                          >
                            <span className="text-sm">{getCategoryIcon(report.category)}</span>
                            {report.category}
                          </span>
                          <span className="text-[11px] text-white/20" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {report.date}
                          </span>
                        </div>

                        {/* Claim */}
                        <p className="relative z-10 text-white/70 mb-5 leading-relaxed text-[15px] group-hover:text-white/90 transition-colors" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                          {report.claim}
                        </p>

                        {/* Bottom row */}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                              style={{
                                background: `${statusColor}0A`,
                                color: statusColor,
                                border: `1px solid ${statusColor}20`,
                              }}
                            >
                              {report.reportedBy.charAt(0)}
                            </div>
                            <span className="text-xs text-white/30" style={{ fontFamily: 'Outfit, sans-serif' }}>{report.reportedBy}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon size={12} style={{ color: statusColor }} />
                              <span className="text-[11px] font-medium" style={{ color: statusColor, fontFamily: 'Outfit, sans-serif' }}>
                                {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md group-hover:bg-white/[0.03] transition-colors"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              <ArrowUp size={12} />
                              <span className="text-xs font-mono">{report.votes}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </Masonry>
              </motion.div>
            </AnimatePresence>

            {/* Empty state */}
            {filteredReports.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Filter className="w-7 h-7 text-white/15" />
                  </div>
                </div>
                <p className="text-lg text-white/30 mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>No reports match your filters</p>
                <button
                  onClick={() => { setSelectedCategory("All"); setSelectedStatus("All"); }}
                  className="text-sm text-[var(--electric-cyan)]/50 hover:text-[var(--electric-cyan)] transition-colors"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Clear all filters →
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
