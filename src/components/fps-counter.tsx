import React, { useEffect, useRef } from "react";

const FPSCounter: React.FC = () => {
  const fpsDisplayRef = useRef<HTMLSpanElement>(null);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const calculateFps = (currentTime: DOMHighResTimeStamp) => {
      frameCount.current++;
      const elapsed = currentTime - lastFrameTime.current;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        if (fpsDisplayRef.current) {
          fpsDisplayRef.current.textContent = currentFps.toString();
        }
        frameCount.current = 0;
        lastFrameTime.current = currentTime;
      }

      animationFrameId.current = requestAnimationFrame(calculateFps);
    };

    animationFrameId.current = requestAnimationFrame(calculateFps);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white text-sm font-mono px-3 py-1 rounded-lg shadow-md z-50">
      FPS:{" "}
      <span ref={fpsDisplayRef} className="font-bold text-green-400">
        0
      </span>
    </div>
  );
};

export default FPSCounter;
