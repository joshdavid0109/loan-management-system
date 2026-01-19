import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export type AppSettings = {
  companyName: string;
  defaultCurrency: string;
  defaultInterestRate: number;
  maxLoanAmount: number;
  minLoanAmount: number;
  maxLoanTerm: number;
  minLoanTerm: number;
};

type SettingsContextType = {
  settings: AppSettings | null;
  saveSettings: (s: AppSettings) => Promise<void>;
  loading: boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  /** Load settings once */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .single();

      if (data) setSettings(data);
      setLoading(false);
    })();
  }, []);

  const saveSettings = async (newSettings: AppSettings) => {
    await supabase.from("app_settings").upsert(newSettings);
    setSettings(newSettings); // 🔥 this triggers all subscribers
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};
