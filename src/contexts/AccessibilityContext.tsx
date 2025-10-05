import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  dyslexicFont: boolean;
  reduceMotion: boolean;
  enhancedFocus: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleHighContrast: () => void;
  toggleDyslexicFont: () => void;
  toggleReduceMotion: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 16,
  highContrast: false,
  dyslexicFont: false,
  reduceMotion: false,
  enhancedFocus: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Carregar configurações salvas
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }

    // Detectar preferências do sistema
    return {
      ...defaultSettings,
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: more)').matches,
    };
  });

  // Aplicar configurações ao documento
  useEffect(() => {
    const root = document.documentElement;

    // Tamanho da fonte
    root.style.setProperty('--user-font-size', `${settings.fontSize}px`);

    // Alto contraste
    document.body.classList.toggle('high-contrast', settings.highContrast);

    // Fonte para dislexia
    document.body.classList.toggle('dyslexic-font', settings.dyslexicFont);

    // Reduzir movimento
    document.body.classList.toggle('reduce-motion', settings.reduceMotion);

    // Foco aprimorado
    document.body.classList.toggle('enhanced-focus', settings.enhancedFocus);

    // Salvar no localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const increaseFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(prev.fontSize + 2, 24), // Máximo 24px
    }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(prev.fontSize - 2, 12), // Mínimo 12px
    }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleDyslexicFont = () => {
    setSettings(prev => ({ ...prev, dyslexicFont: !prev.dyslexicFont }));
  };

  const toggleReduceMotion = () => {
    setSettings(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        toggleDyslexicFont,
        toggleReduceMotion,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
