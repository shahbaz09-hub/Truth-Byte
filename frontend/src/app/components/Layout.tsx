import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Shield, Search as SearchIcon, Users, LayoutDashboard, Zap, LogOut, ChevronDown, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { getAuthToken, removeAuthToken, getUserInfo } from "../services/api";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    const info = getUserInfo();
    setUserName(info?.fullName || "");
    setUserEmail(info?.email || "");
    setUserMenuOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/verify", label: "Verify Claim", icon: Shield },
    { path: "/analyze-url", label: "Analyze URL", icon: SearchIcon },
    { path: "/community", label: "Community", icon: Users },
    { path: "/search", label: "Search", icon: SearchIcon },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/intelligence-hub", label: "Intelligence Hub", icon: Bot },
  ];

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--deep-black)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--electric-cyan)] rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--crimson)] rounded-full blur-[150px] opacity-20" />
        </div>
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
      </div>

      {/* ═══════════ ENHANCED NAVIGATION ═══════════ */}
      <style>{`
        @keyframes navGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
        style={{
          background: scrolled
            ? 'linear-gradient(180deg, rgba(8, 11, 26, 0.92), rgba(8, 11, 26, 0.85))'
            : 'linear-gradient(180deg, rgba(8, 11, 26, 0.85), rgba(8, 11, 26, 0.72))',
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0, 245, 255, 0.16), transparent)' }} />

        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo — TruthByte styled */}
            <Link to="/" className="flex items-center gap-2.5 group -ml-1 lg:-ml-2">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,245,255,0.25)]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.12), rgba(0, 245, 255, 0.04))',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                  }}
                >
                  <Zap className="w-4.5 h-4.5 text-[var(--electric-cyan)]" />
                </div>
              </div>
              <div className="flex items-baseline gap-0">
                <span className="text-xl text-white/90 tracking-wide" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Truth</span>
                <span className="text-xl tracking-wide" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--electric-cyan)' }}>Byte</span>
              </div>
            </Link>

            {/* Desktop Right Cluster — navigation + actions */}
            <div className="hidden md:flex items-center gap-3 ml-auto lg:mr-1">
              <div className="flex items-center gap-1 mr-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="relative px-4 py-2 text-sm rounded-lg transition-all duration-200"
                      style={{
                        color: isActive ? 'var(--electric-cyan)' : 'rgba(255,255,255,0.55)',
                        background: isActive ? 'rgba(0, 245, 255, 0.06)' : 'transparent',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: isActive ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                          style={{
                            background: 'var(--electric-cyan)',
                            boxShadow: '0 0 8px var(--electric-cyan)',
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="relative">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-full"
                      style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.16)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ background: 'linear-gradient(135deg, #00F5FF, #00D4FF)', color: 'var(--deep-black)', fontFamily: 'Outfit, sans-serif' }}
                      >
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <ChevronDown size={13} className="text-white/60" />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute right-0 top-12 w-72 rounded-xl p-4"
                          style={{
                            background: 'rgba(8, 11, 26, 0.96)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                          }}
                        >
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            User Details
                          </p>
                          <div className="px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <p className="text-sm text-white/90" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{userName || 'User'}</p>
                            <p className="text-xs text-white/45 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{userEmail || 'Signed in account'}</p>
                          </div>
                          <button
                            onClick={() => {
                              removeAuthToken();
                              setIsLoggedIn(false);
                              setUserName("");
                              setUserEmail("");
                              setUserMenuOpen(false);
                              navigate("/login");
                            }}
                            className="w-full px-3 py-2 text-sm text-red-500/80 hover:text-red-400 transition-colors flex items-center gap-2 rounded-lg"
                            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, background: 'rgba(255,255,255,0.02)' }}
                          >
                            <LogOut size={15} />
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
                    style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400 }}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white/70 hover:text-white p-2 rounded-lg transition-all hover:bg-white/[0.05]"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
              style={{
                background: 'rgba(8, 11, 26, 0.97)',
                borderTop: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <div className="px-4 py-5 space-y-1">
                <div className="mb-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.12)' }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>User</p>
                  <p className="text-sm text-white/85" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {isLoggedIn ? (userName || 'User') : 'Guest'}
                  </p>
                  {isLoggedIn && userEmail && (
                    <p className="text-xs text-white/50 truncate mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {userEmail}
                    </p>
                  )}
                </div>

                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{
                        color: isActive ? 'var(--electric-cyan)' : 'rgba(255,255,255,0.5)',
                        background: isActive ? 'rgba(0, 245, 255, 0.06)' : 'transparent',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  );
                })}
                <div className="pt-3 border-t border-white/5 mt-3">
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        removeAuthToken();
                        setIsLoggedIn(false);
                        setUserName("");
                        setUserEmail("");
                        setMobileMenuOpen(false);
                        navigate("/login");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-red-500/80 hover:text-red-400 transition-colors"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400 }}
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-white/50 hover:text-white/80 transition-colors"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400 }}
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main className="pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* ═══════════ COMPACT CINEMATIC FOOTER ═══════════ */}
      <footer className="relative pb-20 md:pb-0 overflow-hidden">
        <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0, 245, 255, 0.15), rgba(123, 97, 255, 0.1), transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          {/* Main footer content — single row on desktop */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* Brand */}
            <div className="max-w-xs">
              <Link to="/" className="flex items-center gap-2 mb-3 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0, 245, 255, 0.15)' }}>
                  <Zap className="w-3.5 h-3.5 text-[var(--electric-cyan)]" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-base text-white/80" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Truth</span>
                  <span className="text-base" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--electric-cyan)' }}>Byte</span>
                </div>
              </Link>
              <p className="text-white/20 text-xs leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                AI-powered misinformation detection. Fighting fake news with ML and verified sources.
              </p>
            </div>

            {/* Links — horizontal groups */}
            <div className="flex gap-12 md:gap-16">
              <div>
                <h4 className="text-[9px] text-white/25 uppercase tracking-[0.25em] mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Platform</h4>
                <div className="space-y-1.5">
                  {[
                    { to: "/verify", label: "Verify" },
                    { to: "/analyze-url", label: "Analyze" },
                    { to: "/community", label: "Community" },
                    { to: "/dashboard", label: "Dashboard" },
                  ].map(link => (
                    <Link key={link.to} to={link.to} className="block text-white/20 hover:text-white/50 text-xs transition-colors" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[9px] text-white/25 uppercase tracking-[0.25em] mb-3" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>Account</h4>
                <div className="space-y-1.5">
                  {[
                    { to: "/login", label: "Sign In" },
                    { to: "/register", label: "Register" },
                    { to: "/search", label: "Search" },
                  ].map(link => (
                    <Link key={link.to} to={link.to} className="block text-white/20 hover:text-white/50 text-xs transition-colors" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Social + Newsletter compact */}
            <div className="max-w-[200px]">
              <div className="flex gap-2 mb-3">
                {["X", "GH", "IN"].map((s, i) => (
                  <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-mono text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {s}
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input type="email" placeholder="your@email" className="flex-1 px-3 py-1.5 rounded-lg text-[11px] text-white placeholder-white/12 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'Outfit, sans-serif', fontWeight: 300, minWidth: 0 }} />
                <button className="px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider text-[var(--deep-black)] font-medium"
                  style={{ background: 'linear-gradient(135deg, #00F5FF, #00D4FF)', fontFamily: 'Outfit, sans-serif' }}>
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2">
              <span className="text-white/12 text-[11px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>© 2026 TruthByte</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono text-white/12" style={{ background: 'rgba(255,255,255,0.02)' }}>v2.4</span>
            </div>
            <div className="flex items-center gap-5">
              {["Privacy", "Terms", "API", "Status"].map(item => (
                <span key={item} className="text-white/12 text-[11px] hover:text-white/30 transition-colors cursor-pointer" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      {!isAuthPage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{
            background: 'rgba(8, 11, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-around py-2.5">
            {navLinks.slice(0, 4).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors"
                  style={{ color: isActive ? 'var(--electric-cyan)' : 'rgba(255,255,255,0.35)' }}
                >
                  <Icon size={18} />
                  <span className="text-[10px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: isActive ? 500 : 300 }}>
                    {link.label.split(" ")[0]}
                  </span>
                </Link>
              );
            })}
            <Link
              to="/dashboard"
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors"
              style={{ color: location.pathname === "/dashboard" ? 'var(--electric-cyan)' : 'rgba(255,255,255,0.35)' }}
            >
              <LayoutDashboard size={18} />
              <span className="text-[10px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: location.pathname === "/dashboard" ? 500 : 300 }}>Dashboard</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
