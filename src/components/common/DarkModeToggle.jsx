import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Animated toggle switch for light/dark mode.
 * Displays a Sun icon in dark mode and Moon icon in light mode.
 */
const DarkModeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative inline-flex items-center w-14 h-7 rounded-full
        transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDarkMode
          ? 'bg-blue-600 focus:ring-offset-gray-800'
          : 'bg-slate-200 focus:ring-offset-white'
        }
      `}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 text-yellow-400 w-4 h-4 flex items-center justify-center">
        <Sun className="w-3.5 h-3.5" />
      </span>
      <span className="absolute right-1.5 text-slate-400 w-4 h-4 flex items-center justify-center">
        <Moon className="w-3.5 h-3.5" />
      </span>

      {/* Sliding knob */}
      <span
        className={`
          absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md
          transition-transform duration-300 ease-in-out flex items-center justify-center
          ${isDarkMode ? 'translate-x-7' : 'translate-x-0.5'}
        `}
      >
        {isDarkMode
          ? <Moon className="w-3.5 h-3.5 text-blue-600" />
          : <Sun className="w-3.5 h-3.5 text-amber-500" />
        }
      </span>
    </button>
  );
};

export default DarkModeToggle;
