import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
 // Default to dark mode if no preference is found
 const [isDark, setIsDark] = useState(() => {
 const stored = localStorage.getItem('theme');
 if (stored) return stored === 'dark';
 return true; // Force dark mode default as requested
 });

 useEffect(() => {
 const root = window.document.documentElement;
 if (isDark) {
 root.classList.add('dark');
 root.classList.remove('light');
 localStorage.setItem('theme', 'dark');
 } else {
 root.classList.add('light');
 root.classList.remove('dark');
 localStorage.setItem('theme', 'light');
 }
 }, [isDark]);

 return (
 <button
 onClick={() => setIsDark(!isDark)}
 className="p-2 rounded-md hover:bg-surface-highlight transition-colors duration-200 text-text-secondary hover:text-primary focus-visible:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
 aria-label="Toggle Theme"
 title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
 >
 {isDark ? (
 <Sun className="h-5 w-5 transition-transform duration-300" />
 ) : (
 <Moon className="h-5 w-5 transition-transform duration-300" />
 )}
 </button>
 );
};

export default ThemeToggle;
