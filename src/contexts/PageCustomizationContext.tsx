import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface PagePreferences {
  layout_style: 'compact' | 'wide' | 'centered';
  theme_mode: 'dark' | 'light';
  accent_color: 'gold' | 'blue' | 'purple' | 'green' | 'red';
  background_style: 'default' | 'gradient' | 'minimal';
  button_style: 'rounded' | 'sharp' | 'pill';
  ui_density: 'compact' | 'comfortable' | 'spacious';
}

interface PageCustomizationContextType {
  preferences: PagePreferences;
  updatePreferences: (prefs: Partial<PagePreferences>) => Promise<void>;
  isLoading: boolean;
}

const defaultPreferences: PagePreferences = {
  layout_style: 'wide',
  theme_mode: 'dark',
  accent_color: 'gold',
  background_style: 'default',
  button_style: 'rounded',
  ui_density: 'comfortable'
};

const PageCustomizationContext = createContext<PageCustomizationContextType | undefined>(undefined);

export const PageCustomizationProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<PagePreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    applyPreferencesToDOM();
  }, [preferences]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_page_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          layout_style: data.layout_style as PagePreferences['layout_style'],
          theme_mode: data.theme_mode as PagePreferences['theme_mode'],
          accent_color: data.accent_color as PagePreferences['accent_color'],
          background_style: data.background_style as PagePreferences['background_style'],
          button_style: data.button_style as PagePreferences['button_style'],
          ui_density: data.ui_density as PagePreferences['ui_density']
        });
      }
    } catch (error) {
      console.error('Error loading page preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPrefs: Partial<PagePreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_page_preferences')
          .upsert({
            user_id: user.id,
            ...updated
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };

  const applyPreferencesToDOM = () => {
    const root = document.documentElement;
    
    // Apply theme mode
    root.setAttribute('data-theme', preferences.theme_mode);
    
    // Apply accent color
    root.setAttribute('data-accent', preferences.accent_color);
    
    // Apply layout style
    root.setAttribute('data-layout', preferences.layout_style);
    
    // Apply button style
    root.setAttribute('data-button-style', preferences.button_style);
    
    // Apply UI density
    root.setAttribute('data-density', preferences.ui_density);
  };

  return (
    <PageCustomizationContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </PageCustomizationContext.Provider>
  );
};

export const usePageCustomization = () => {
  const context = useContext(PageCustomizationContext);
  if (!context) {
    throw new Error('usePageCustomization must be used within PageCustomizationProvider');
  }
  return context;
};