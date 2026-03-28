import { useEffect, useRef } from "react";
import { motion } from "motion/react";

export function TruthScale3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 300;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    let rotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      rotation += 0.01;

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw scale base
      const scaleWidth = 150;
      const scaleHeight = 10;
      
      // Draw pivot point
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.sin(rotation) * 0.3);
      
      // Left plate (TRUTH - green)
      ctx.beginPath();
      ctx.moveTo(-scaleWidth, 0);
      ctx.lineTo(-scaleWidth + 40, -60);
      ctx.lineTo(-scaleWidth - 40, -60);
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 255, 136, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 255, 136, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Left chain
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-scaleWidth, -60 + i * 20, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 245, 255, 0.6)";
        ctx.fill();
      }

      // Right plate (LIE - red)
      ctx.beginPath();
      ctx.moveTo(scaleWidth, 0);
      ctx.lineTo(scaleWidth - 40, -60);
      ctx.lineTo(scaleWidth + 40, -60);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 45, 85, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 45, 85, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Right chain
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(scaleWidth, -60 + i * 20, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 245, 255, 0.6)";
        ctx.fill();
      }

      // Draw balance beam
      ctx.beginPath();
      ctx.rect(-scaleWidth - 10, -5, scaleWidth * 2 + 20, scaleHeight);
      ctx.fillStyle = "rgba(0, 245, 255, 0.4)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 245, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw pivot
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 245, 255, 1)";
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(0, 245, 255, 0.8)";
      ctx.fill();

      ctx.restore();

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <canvas
        ref={canvasRef}
        className="drop-shadow-[0_0_50px_rgba(0,245,255,0.3)]"
      />
      <div className="absolute -bottom-12 left-0 right-0 flex justify-between px-8 text-sm font-mono">
        <span className="text-[var(--chart-5)]">TRUTH</span>
        <span className="text-[var(--crimson)]">LIE</span>
      </div>
    </motion.div>
  );
}
