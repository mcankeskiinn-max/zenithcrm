import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-between w-14 h-7 p-1 rounded-full bg-secondary border border-border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Toggle Theme"
        >
            <div
                className={`absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                    }`}
            />
            <Sun className={`w-3.5 h-3.5 ml-1 z-10 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Moon className={`w-3.5 h-3.5 mr-1 z-10 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
        </button>
    );
}
