import { motion } from "motion/react";
import { Shield, Zap, Eye, TrendingUp, CheckCircle2, ArrowRight, Quote, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import { ParticleNetwork } from "../components/ParticleNetwork";
import { GlitchText } from "../components/GlitchText";

export function LandingPage() {
  const [claimsAnalyzed, setClaimsAnalyzed] = useState(0);
  const [fakeNewsCaught, setFakeNewsCaught] = useState(0);

  useEffect(() => {
    // Animate counters
    const claimsTarget = 1247893;
    const fakeTarget = 89234;
    const duration = 2000;
    const steps = 60;
    const claimsIncrement = claimsTarget / steps;
    const fakeIncrement = fakeTarget / steps;
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setClaimsAnalyzed(Math.floor(claimsIncrement * step));
      setFakeNewsCaught(Math.floor(fakeIncrement * step));
      
      if (step >= steps) {
        clearInterval(interval);
        setClaimsAnalyzed(claimsTarget);
        setFakeNewsCaught(fakeTarget);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "AI-Powered Verification",
      description: "Advanced algorithms cross-reference claims against trusted databases in real-time",
      accent: "var(--electric-cyan)",
      accentBg: "rgba(0, 245, 255, 0.08)",
      accentBorder: "rgba(0, 245, 255, 0.25)"
    },
    {
      icon: Zap,
      title: "Instant Analysis",
      description: "Get comprehensive fact-checks in seconds with detailed source citations",
      accent: "var(--amber)",
      accentBg: "rgba(255, 184, 0, 0.08)",
      accentBorder: "rgba(255, 184, 0, 0.25)"
    },
    {
      icon: Eye,
      title: "Bias Detection",
      description: "Identify political leanings and manipulative language patterns automatically",
      accent: "var(--crimson)",
      accentBg: "rgba(255, 45, 85, 0.08)",
      accentBorder: "rgba(255, 45, 85, 0.25)"
    }
  ];

  const steps = [
    { number: "01", title: "Submit Claim", description: "Paste any text claim or URL you want to verify", icon: "📝" },
    { number: "02", title: "AI Analysis", description: "Our AI scans thousands of trusted sources instantly", icon: "🧠" },
    { number: "03", title: "Get Verdict", description: "Receive a detailed breakdown with confidence scores", icon: "✅" }
  ];

  const testimonials = [
    {
      quote: "TruthByte has become an essential tool in our newsroom. The AI analysis is incredibly accurate.",
      author: "Sarah Chen",
      role: "Senior Editor, Metro News",
      accent: "var(--electric-cyan)"
    },
    {
      quote: "Finally, a fact-checking tool that keeps up with the speed of social media. Game-changing.",
      author: "Marcus Johnson",
      role: "Digital Investigator",
      accent: "var(--amber)"
    },
    {
      quote: "The bias detection feature is brilliant. It helps us maintain objectivity in our reporting.",
      author: "Emma Rodriguez",
      role: "Investigative Journalist",
      accent: "var(--chart-4)"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Particle Background */}
        <ParticleNetwork />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <GlitchText text="TruthByte" className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-outfit text-xl sm:text-2xl md:text-3xl text-white/80 mb-4 max-w-3xl mx-auto font-light tracking-wide"
            >
              AI-Powered Misinformation Detection
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Uncover the truth in seconds. Advanced AI analyzes claims, detects bias, and reveals manipulative patterns in real-time.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/verify"
                className="group px-8 py-4 bg-[var(--electric-cyan)] text-[var(--deep-black)] rounded-xl hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] transition-all hover:scale-105 flex items-center gap-2 font-semibold"
              >
                Start Fact-Checking
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link
                to="/analyze-url"
                className="px-8 py-4 border border-white/20 text-white/90 rounded-xl hover:bg-white/5 hover:border-white/40 transition-all flex items-center gap-2"
              >
                Analyze URL
              </Link>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-20 flex flex-col md:flex-row gap-12 justify-center items-center"
            >
              <div className="text-center group">
                <div className="text-4xl md:text-5xl font-mono text-[var(--electric-cyan)] mb-2 tabular-nums">
                  {claimsAnalyzed.toLocaleString()}
                </div>
                <div className="font-outfit text-white/40 text-sm uppercase tracking-[0.2em] font-light">Claims Analyzed</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-white/10" />
              <div className="text-center group">
                <div className="text-4xl md:text-5xl font-mono text-[var(--crimson)] mb-2 tabular-nums">
                  {fakeNewsCaught.toLocaleString()}
                </div>
                <div className="font-outfit text-white/40 text-sm uppercase tracking-[0.2em] font-light">Fake News Caught</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2"
          >
            <motion.div className="w-1 h-2 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works — Timeline Layout */}
      <section className="py-28 md:py-36 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="font-outfit text-[var(--electric-cyan)] text-sm uppercase tracking-[0.3em] mb-4 font-medium">Process</p>
            <h2 className="text-5xl md:text-6xl text-white mb-4">How It Works</h2>
            <p className="font-outfit text-lg text-white/40 font-light max-w-lg">Three simple steps to verify any claim. Fast, reliable, transparent.</p>
          </motion.div>

          <div className="relative">
            {/* Vertical connecting line */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--electric-cyan)]/30 via-[var(--amber)]/30 to-[var(--chart-5)]/30" />

            <div className="space-y-8 md:space-y-12">
              {steps.map((step, index) => {
                const colors = ["var(--electric-cyan)", "var(--amber)", "var(--chart-5)"];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className="relative flex items-start gap-6 md:gap-8 group"
                  >
                    {/* Step number bubble */}
                    <div 
                      className="relative flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl z-10 transition-transform group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors[index]}15, ${colors[index]}05)`,
                        border: `1px solid ${colors[index]}30`
                      }}
                    >
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-mono text-xs tracking-wider" style={{ color: colors[index] }}>{step.number}</span>
                        <h3 className="text-2xl text-white">{step.title}</h3>
                      </div>
                      <p className="font-outfit text-white/50 text-base font-light leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features — Mixed Layout */}
      <section className="py-28 md:py-36 relative">
        {/* Subtle section separator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="font-outfit text-[var(--electric-cyan)] text-sm uppercase tracking-[0.3em] mb-4 font-medium">Capabilities</p>
            <h2 className="text-5xl md:text-6xl mb-4 text-white">Powerful Features</h2>
            <p className="font-outfit text-lg text-white/40 font-light max-w-lg">Advanced AI meets investigative journalism</p>
          </motion.div>

          {/* Hero feature card — full width */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="mb-6 relative overflow-hidden rounded-2xl transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${features[0].accentBg}, transparent 60%)`,
              border: `1px solid ${features[0].accentBorder}`
            }}
          >
            <div className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: `${features[0].accentBg}`,
                  border: `1px solid ${features[0].accentBorder}`
                }}
              >
                <Shield className="w-8 h-8" style={{ color: features[0].accent }} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl mb-2 text-white">{features[0].title}</h3>
                <p className="font-outfit text-white/50 text-lg font-light leading-relaxed max-w-xl">{features[0].description}</p>
              </div>
              <ArrowRight className="hidden md:block w-6 h-6 text-white/20" />
            </div>
          </motion.div>

          {/* Two smaller feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.slice(1).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index + 1) * 0.15 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-2xl p-8 transition-all duration-300 group"
                  style={{
                    background: `linear-gradient(160deg, ${feature.accentBg}, transparent 70%)`,
                    border: `1px solid ${feature.accentBorder}`
                  }}
                >
                  {/* Top line accent */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-px opacity-60"
                    style={{ background: `linear-gradient(to right, ${feature.accent}, transparent)` }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ 
                      background: feature.accentBg,
                      border: `1px solid ${feature.accentBorder}`
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.accent }} />
                  </div>
                  <h3 className="text-xl md:text-2xl mb-3 text-white">{feature.title}</h3>
                  <p className="font-outfit text-white/50 font-light leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials — Organic Layout */}
      <section className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="font-outfit text-[var(--electric-cyan)] text-sm uppercase tracking-[0.3em] mb-4 font-medium">Testimonials</p>
            <h2 className="text-5xl md:text-6xl mb-4 text-white">Trusted By Professionals</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className="relative rounded-2xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderLeft: `3px solid ${testimonial.accent}`,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                {/* Quote icon */}
                <div className="mb-5 opacity-30" style={{ color: testimonial.accent }}>
                  <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor">
                    <path d="M0 20V8.5C0 6.167 0.5 4.125 1.5 2.375C2.533 0.625 4.4 0 7 0L8 3C6.333 3.167 5.167 3.708 4.5 4.625C3.833 5.542 3.5 6.667 3.5 8H7.5V20H0ZM15.5 20V8.5C15.5 6.167 16 4.125 17 2.375C18.033 0.625 19.9 0 22.5 0L23.5 3C21.833 3.167 20.667 3.708 20 4.625C19.333 5.542 19 6.667 19 8H23V20H15.5Z"/>
                  </svg>
                </div>
                
                <p className="text-white/70 mb-8 leading-relaxed text-[15px]">{testimonial.quote}</p>
                
                <div className="flex items-center gap-3">
                  {/* Avatar initial */}
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ 
                      background: `${testimonial.accent}15`,
                      color: testimonial.accent,
                      border: `1px solid ${testimonial.accent}30`
                    }}
                  >
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{testimonial.author}</div>
                    <div className="font-outfit text-white/40 text-xs font-light">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Dramatic */}
      <section className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-outfit text-[var(--electric-cyan)] text-sm uppercase tracking-[0.3em] mb-6 font-medium">Get Started</p>
            <h2 className="text-4xl md:text-6xl lg:text-7xl mb-6 text-white leading-tight">Ready to Uncover<br/>the Truth?</h2>
            <p className="font-outfit text-lg md:text-xl text-white/40 mb-10 max-w-xl mx-auto font-light">Join thousands of professionals fighting misinformation with AI-powered fact-checking.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/verify"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-[var(--electric-cyan)] text-[var(--deep-black)] rounded-xl hover:shadow-[0_0_40px_rgba(0,245,255,0.5)] transition-all hover:scale-105 font-semibold text-lg"
              >
                <Sparkles size={20} />
                Start Fact-Checking Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-5 text-white/60 hover:text-white transition-colors text-lg"
              >
                Create Free Account →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
