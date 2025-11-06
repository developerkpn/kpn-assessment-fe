import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

const backendOptions = {
  loadPath: `${import.meta.env.VITE_API_URL}/languages/elements?lng={{lng}}`,
};

// Get the default language from localStorage (Zustand persist)
const getInitialLanguage = () => {
  try {
    const stored = localStorage.getItem('language-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.selectedLanguage || 'en';
    }
  } catch (e) {
    console.error('Failed to get language from localStorage', e);
  }
  return 'en'; // Default to English
};

i18n
  .use(Backend)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: getInitialLanguage(), // Set initial language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    backend: backendOptions,
  });

export default i18n;
