import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';

export const ThemeToggle: React.FC = () => {
    // Default to light mode
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            return (savedTheme as 'light' | 'dark') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-9 h-9 p-0"
            title="Toggle theme"
        >
            {theme === 'light' ? (
                <Sun className="h-5 w-5 text-amber-500 transition-all duration-300 rotate-0 scale-100" />
            ) : (
                <Moon className="h-5 w-5 text-indigo-400 transition-all duration-300 rotate-0 scale-100" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};
