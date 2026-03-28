import { useEffect, useRef } from "react";

export function DNAHelix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 200;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    let rotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      rotation += 0.03;

      // Draw helix strands
      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        
        for (let i = 0; i < 50; i++) {
          const y = (i / 50) * height;
          const angle = rotation + (i / 10) + strand * Math.PI;
          const x = width / 2 + Math.cos(angle) * 40;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.strokeStyle = strand === 0 
          ? "rgba(0, 245, 255, 0.8)" 
          : "rgba(0, 245, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw connecting bars
      for (let i = 0; i < 50; i += 3) {
        const y = (i / 50) * height;
        const angle1 = rotation + (i / 10);
        const angle2 = rotation + (i / 10) + Math.PI;
        
        const x1 = width / 2 + Math.cos(angle1) * 40;
        const x2 = width / 2 + Math.cos(angle2) * 40;
        
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = "rgba(0, 245, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="drop-shadow-[0_0_30px_rgba(0,245,255,0.5)]"
      />
    </div>
  );
}
