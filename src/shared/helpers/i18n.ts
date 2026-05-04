import {
	initReactI18next
} from 'react-i18next';
import i18n from 'i18next';
import enTranslations from '../../locales/en.json';
import esTranslations from '../../locales/es.json';
import caTranslations from '../../locales/ca.json';

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: enTranslations },
			es: { translation: esTranslations },
			ca: { translation: caTranslations }
		},
		lng: localStorage.getItem('lang') ?? 'en',
		fallbackLng: "en",
		interpolation: {
			escapeValue: false
		}
});


export default i18n;