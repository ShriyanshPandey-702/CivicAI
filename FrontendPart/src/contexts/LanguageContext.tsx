import { createContext, useContext, useState, type ReactNode } from 'react';
import { TRANSLATIONS } from '@/lib/constants';

type Lang = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('civicai-lang') as Lang) || 'en'
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('civicai-lang', l);
  };

  const t = (key: string): string => {
    const translations = TRANSLATIONS[lang] as Record<string, string>;
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
