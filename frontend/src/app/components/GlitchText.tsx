import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = "" }: GlitchTextProps) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      <h1
        className="relative z-10 text-white"
        style={{
          fontFamily: 'Bebas Neue, cursive',
          textShadow: glitch
            ? `
              -2px 0 2px rgba(255, 0, 0, 0.5),
              2px 0 2px rgba(0, 255, 255, 0.5),
              0 0 20px rgba(0, 245, 255, 0.8)
            `
            : "0 0 20px rgba(0, 245, 255, 0.5)",
          transition: "text-shadow 0.1s"
        }}
      >
        {text}
      </h1>
      {glitch && (
        <>
          <h1
            className="absolute inset-0 text-white"
            style={{
              fontFamily: 'Bebas Neue, cursive',
              left: '-2px',
              color: 'rgba(255, 0, 0, 0.7)',
              mixBlendMode: 'screen',
              clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)'
            }}
          >
            {text}
          </h1>
          <h1
            className="absolute inset-0 text-white"
            style={{
              fontFamily: 'Bebas Neue, cursive',
              left: '2px',
              color: 'rgba(0, 255, 255, 0.7)',
              mixBlendMode: 'screen',
              clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)'
            }}
          >
            {text}
          </h1>
        </>
      )}
    </div>
  );
}
