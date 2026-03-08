import { createContext, useContext, useState, ReactNode } from "react";

interface AnonymousContextType {
  isAnonymous: boolean;
  toggleAnonymous: () => void;
  setAnonymous: (value: boolean) => void;
  anonAlias: string;
}

const ANON_ALIASES = [
  "Mwananchi", "Mjumbe", "Sauti", "Shahidi", "Mchunguzi",
  "Mlinzi", "Jasusi", "Hodari", "Shujaa", "Msemaji",
];

const AnonymousContext = createContext<AnonymousContextType | undefined>(undefined);

export const AnonymousProvider = ({ children }: { children: ReactNode }) => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonAlias] = useState(() => {
    const idx = Math.floor(Math.random() * ANON_ALIASES.length);
    return ANON_ALIASES[idx];
  });

  const toggleAnonymous = () => setIsAnonymous((v) => !v);
  const setAnonymous = (value: boolean) => setIsAnonymous(value);

  return (
    <AnonymousContext.Provider value={{ isAnonymous, toggleAnonymous, setAnonymous, anonAlias }}>
      {children}
    </AnonymousContext.Provider>
  );
};

export const useAnonymous = () => {
  const context = useContext(AnonymousContext);
  if (!context) throw new Error("useAnonymous must be used within AnonymousProvider");
  return context;
};
