import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrollHeight) {
        const percentage = (currentScroll / scrollHeight) * 100;
        setProgress(Math.min(100, Math.max(0, percentage)));
      }
    };

    window.addEventListener("scroll", updateProgress);
    updateProgress(); // Inicializa no carregamento

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 h-1.5 w-full bg-transparent print:hidden">
      <div 
        className="h-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}