import { motion } from "motion/react";
import { AlertTriangle, Home, Search } from "lucide-react";
import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--crimson)]/20 mb-8"
        >
          <AlertTriangle className="w-12 h-12 text-[var(--crimson)]" />
        </motion.div>

        <h1 className="text-8xl md:text-9xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, cursive' }}>
          404
        </h1>
        <h2 className="text-3xl md:text-4xl text-white mb-4">Page Not Found</h2>
        <p className="text-xl text-white/60 mb-8">
          This claim couldn't be verified because the page doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--electric-cyan)] text-[var(--deep-black)] rounded-lg hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] transition-all hover:scale-105"
          >
            <Home size={20} />
            Back to Home
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <Search size={20} />
            Search Claims
          </Link>
        </div>

        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity
          }}
          className="mt-16 text-[var(--electric-cyan)] font-mono text-sm"
        >
          ERROR_CODE: PAGE_NOT_VERIFIED
        </motion.div>
      </motion.div>
    </div>
  );
}
