import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { TruthScale3D } from "../components/TruthScale3D";
import { loginUser, isAuthenticated, warmupBackend } from "../services/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"connecting" | "authenticating" | "done">("connecting");
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
    // Warmup backend on login page load (fire-and-forget)
    warmupBackend();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoadingStage("connecting");

    // After 3 seconds, show "authenticating" stage
    const stageTimer = setTimeout(() => setLoadingStage("authenticating"), 3000);

    try {
      await loginUser(email, password);
      setLoadingStage("done");
      clearTimeout(stageTimer);
      // Small delay for "done" animation, then navigate
      setTimeout(() => navigate("/dashboard"), 400);
    } catch (err: any) {
      clearTimeout(stageTimer);
      setError(err.message || "Failed to login");
      setIsLoading(false);
      setLoadingStage("connecting");
    }
  };

  const loadingMessages = {
    connecting: "Connecting to server...",
    authenticating: "Authenticating...",
    done: "Welcome back!",
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[var(--midnight-navy)] to-[var(--deep-black)] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--electric-cyan)] rounded-full blur-[150px] opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--crimson)] rounded-full blur-[150px] opacity-30" />
        </div>

        <div className="relative z-10 text-center px-12">
          <TruthScale3D />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-4xl text-white mb-4">Welcome to TruthByte</h2>
            <p className="text-xl text-white/60">
              Your AI-powered shield against misinformation
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--deep-black)]">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Link to="/landing" className="flex items-center gap-2 mb-8 group">
              <Shield className="w-8 h-8 text-[var(--electric-cyan)] group-hover:rotate-12 transition-transform" />
              <span className="text-2xl tracking-wider text-white" style={{ fontFamily: 'Bebas Neue, cursive' }}>
                TruthByte
              </span>
            </Link>

            <h1 className="text-4xl text-white mb-2">Sign In</h1>
            <p className="text-white/60">Enter your credentials to access your account</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/80 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--electric-cyan)] transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--electric-cyan)] transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5" />
                <span className="text-sm text-white/60">Remember me</span>
              </label>
              <Link to="#" className="text-sm text-[var(--electric-cyan)] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--electric-cyan)] text-[var(--deep-black)] rounded-lg hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{loadingMessages[loadingStage]}</span>
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </>
              )}
            </button>

            {/* Cold start hint — shows after 5 seconds of loading */}
            {isLoading && loadingStage === "connecting" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5 }}
                className="text-xs text-white/30 text-center"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                First request may take ~30 seconds while the server wakes up (free tier hosting). Please wait...
              </motion.p>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60">
              Don't have an account?{" "}
              <Link to="/register" className="text-[var(--electric-cyan)] hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-xs text-white/40 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
