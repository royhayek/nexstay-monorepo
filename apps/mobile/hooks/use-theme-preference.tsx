import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createContext, useContext, useEffect, useState } from 'react';
import { UnistylesRuntime } from 'react-native-unistyles';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemePreferenceContextType {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemePreferenceContext = createContext<ThemePreferenceContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@homestay_theme_preference';

interface ThemePreferenceProviderProps {
  children: React.ReactNode;
}

export function ThemePreferenceProvider({ children }: ThemePreferenceProviderProps) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const systemTheme = useColorScheme() ?? 'light';

  // Load saved preference on mount
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemePreferenceState(saved as ThemePreference);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    }
    loadThemePreference();
  }, []);

  // Calculate effective theme
  const effectiveTheme = themePreference === 'system' ? systemTheme : themePreference;

  // Apply theme to Unistyles runtime
  useEffect(() => {
    UnistylesRuntime.setTheme(effectiveTheme);
  }, [effectiveTheme]);

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      setThemePreferenceState(preference);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemePreferenceContext.Provider
      value={{
        themePreference,
        setThemePreference,
        effectiveTheme,
      }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return context;
}