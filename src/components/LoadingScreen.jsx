import { useEffect, useState } from "react";

export const LoadingScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out after 5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Fully remove after 6 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`ring fixed inset-0 z-50 bg-black text-gray-100 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Time Tracker App is Loading...</div>
    </div>
  );
};