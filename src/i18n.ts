import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files would be imported here or loaded via backend
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import ruTranslation from './locales/ru.json';

const getStoredLang = () => {
  try {
    return localStorage.getItem('i18nextLng') || "en";
  } catch (e) {
    return "en";
  }
};

const setStoredLang = (lng: string) => {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch (e) {}
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation },
      ru: { translation: ruTranslation },
    },
    lng: getStoredLang(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

document.documentElement.dir = getStoredLang() === "ar" ? "rtl" : "ltr";

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  setStoredLang(lng);
});

export default i18n;
