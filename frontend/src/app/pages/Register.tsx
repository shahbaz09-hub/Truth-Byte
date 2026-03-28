import { useState } from "react";
import { motion } from "motion/react";
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { TruthScale3D } from "../components/TruthScale3D";
import { registerUser } from "../services/api";

export function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await registerUser(formData.name, formData.email, formData.password);
      navigate("/login"); 
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
            <h2 className="text-4xl text-white mb-4">Join the Truth Movement</h2>
            <p className="text-xl text-white/60">
              Help fight misinformation with AI-powered verification
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
            <Link to="/" className="flex items-center gap-2 mb-8 group">
              <Shield className="w-8 h-8 text-[var(--electric-cyan)] group-hover:rotate-12 transition-transform" />
              <span className="text-2xl tracking-wider text-white" style={{ fontFamily: 'Bebas Neue, cursive' }}>
                TruthByte
              </span>
            </Link>
            
            <h1 className="text-4xl text-white mb-2">Create Account</h1>
            <p className="text-white/60">Sign up to start verifying claims</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/80 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--electric-cyan)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--electric-cyan)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--electric-cyan)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--electric-cyan)] transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 mt-1" required />
              <label className="text-sm text-white/60">
                I agree to the{" "}
                <Link to="#" className="text-[var(--electric-cyan)] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="#" className="text-[var(--electric-cyan)] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--electric-cyan)] text-[var(--deep-black)] rounded-lg hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60">
              Already have an account?{" "}
              <Link to="/login" className="text-[var(--electric-cyan)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
