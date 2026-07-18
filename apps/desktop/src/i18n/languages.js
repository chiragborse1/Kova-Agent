import { normalize } from '@/lib/text';
export const DEFAULT_LOCALE = 'en';
export const LOCALE_OPTIONS = [
    {
        id: 'en',
        name: 'English',
        englishName: 'English',
        configValue: 'en'
    }
];
// `name` is the endonym (native name) shown in the picker so users recognize
// their language regardless of the current UI language. No country flags:
// languages are not countries. `englishName` is search-only (not shown) so an
// English speaker can type "japanese"/"traditional" to filter the list.
export const LOCALE_META = Object.fromEntries(LOCALE_OPTIONS.map(locale => [locale.id, { name: locale.name, englishName: locale.englishName }]));
const LOCALE_ALIASES = {
    en: 'en',
    'en-us': 'en',
    en_us: 'en'
};
export function isLocale(value) {
    return typeof value === 'string' && LOCALE_OPTIONS.some(locale => locale.id === value);
}
export function normalizeLocale(value) {
    if (typeof value !== 'string') {
        return DEFAULT_LOCALE;
    }
    return LOCALE_ALIASES[normalize(value)] ?? DEFAULT_LOCALE;
}
export function isSupportedLocaleValue(value) {
    return typeof value === 'string' && LOCALE_ALIASES[normalize(value)] != null;
}
export function localeConfigValue(locale) {
    return LOCALE_OPTIONS.find(item => item.id === locale)?.configValue ?? DEFAULT_LOCALE;
}
