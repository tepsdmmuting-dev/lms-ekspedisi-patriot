import React, { useState, useEffect } from 'react';

const ThemeToggle = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage on mount (ignore system preference to default to light mode)
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className={`relative p-2 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white/50 border border-slate-200 text-slate-700 hover:bg-white'} ${className}`}
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span className={`material-symbols-outlined transition-transform duration-500 ${isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50 absolute'}`}>
        light_mode
      </span>
      <span className={`material-symbols-outlined transition-transform duration-500 ${isDark ? 'rotate-90 opacity-0 scale-50 absolute' : 'rotate-0 opacity-100 scale-100'}`}>
        dark_mode
      </span>
    </button>
  );
};

export default ThemeToggle;
