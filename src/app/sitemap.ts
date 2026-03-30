import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://wiki.closerinti.me";

  return locales.map((locale) => ({
    url: locale === defaultLocale ? baseUrl : `${baseUrl}/${locale}`,
    priority: locale === defaultLocale ? 1.0 : 0.8,
  }));
}
