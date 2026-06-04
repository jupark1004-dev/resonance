'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeName = 'default' | 'dark' | 'ocean' | 'rose' | 'forest';

interface ThemeContextType {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'default',
    setTheme: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}

export const THEMES: { name: ThemeName; label: string; emoji: string; color: string }[] = [
    { name: 'default', label: '따뜻한 낮', emoji: '☀️', color: '#E74C3C' },
    { name: 'dark',    label: '고요한 밤', emoji: '🌙', color: '#FF6B6B' },
    { name: 'ocean',   label: '깊은 바다', emoji: '🌊', color: '#3498DB' },
    { name: 'rose',    label: '로즈 핑크', emoji: '🌸', color: '#E91E8C' },
    { name: 'forest',  label: '숲의 향기', emoji: '🌿', color: '#27AE60' },
];

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>('default');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('resonance-theme') as ThemeName | null;
        if (saved && THEMES.some((t) => t.name === saved)) {
            setThemeState(saved);
            applyTheme(saved);
        }
        setMounted(true);
    }, []);

    const applyTheme = (name: ThemeName) => {
        if (name === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', name);
        }
    };

    const setTheme = useCallback((name: ThemeName) => {
        setThemeState(name);
        applyTheme(name);
        localStorage.setItem('resonance-theme', name);
    }, []);

    // 마운트 전에는 기본 테마로 렌더링 (깜빡임 방지)
    if (!mounted) {
        return <ThemeContext.Provider value={{ theme: 'default', setTheme }}>{children}</ThemeContext.Provider>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
