import { create } from "zustand";

interface Language {
  id: string;
  language_code: string;
  language_name: string;
  language_name_native: string;
  is_active: boolean;
}

interface LanguageStore {
  selectedLanguage: string; // language_code (e.g., 'id', 'en')
  availableLanguages: Language[];
  setSelectedLanguage: (languageCode: string) => void;
  setAvailableLanguages: (languages: Language[]) => void;
}

const useLanguageStore = create<LanguageStore>((set) => ({
  selectedLanguage: "id", // Default to Indonesian
  availableLanguages: [],
  setSelectedLanguage: (languageCode: string) => set({ selectedLanguage: languageCode }),
  setAvailableLanguages: (languages: Language[]) => set({ availableLanguages: languages }),
}))

export default useLanguageStore;
