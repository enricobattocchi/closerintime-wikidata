export const locales = ["en", "fr", "de", "es", "it", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Fran\u00e7ais",
  de: "Deutsch",
  es: "Espa\u00f1ol",
  it: "Italiano",
  pt: "Portugu\u00eas",
};
