'use client';

import { useEffect, useState } from 'react';

interface LoadingPopupProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingPopup({ isOpen, message = 'Cargando...' }: LoadingPopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      // Delay para animación de salida
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[200px] transform transition-transform duration-200 hover:scale-105">
        {/* Circular Progress Bar */}
        <div className="relative w-16 h-16">
          <svg
            className="w-16 h-16 transform -rotate-90"
            viewBox="0 0 64 64"
          >
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Animated progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="175.929"
              strokeDashoffset="43.98"
              className="text-blue-600 dark:text-blue-400 circular-progress"
            />
          </svg>
        </div>
        
        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 font-medium text-sm text-center">
          {message}
        </p>
      </div>
    </div>
  );
}

