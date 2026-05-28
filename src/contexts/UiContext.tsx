import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { translations, type Language, type TranslationKey } from '../i18n';

type ThemeMode = 'light' | 'dark';

interface UiContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'gestmat_theme';
const LANGUAGE_STORAGE_KEY = 'gestmat_language';

const getInitialTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  return stored === 'fr' ? stored : 'fr';
};

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const html = document.documentElement;
    html.classList.toggle('dark', theme === 'dark');
    html.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setTheme = useCallback((value: ThemeMode) => {
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const setLanguage = useCallback((value: Language) => {
    setLanguageState(value);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] ?? translations.en[key] ?? key,
    [language]
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, language, setLanguage, t }),
    [theme, setTheme, toggleTheme, language, setLanguage, t]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (context === undefined) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
}
