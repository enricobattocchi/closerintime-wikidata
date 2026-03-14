import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavigationLoader from "@/components/NavigationLoader";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL("https://wiki.closerinti.me"),
    title: {
      default: "wiki:closerintime",
      template: "%s | wiki:closerintime",
    },
    description: t("siteDescription"),
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.svg",
      apple: "/icons/icon-192.png",
    },
    openGraph: {
      title: "wiki:closerintime",
      description: t("siteDescription"),
      siteName: "wiki:closerintime",
      images: [{ url: "/api/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "wiki:closerintime",
      description: t("siteDescription"),
      images: ["/api/og"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#101418" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("common");

  return (
    <html lang={locale} className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
        <a href="#main-content" className="skip-link">
          {t("skipToContent")}
        </a>
        <NavigationLoader />
        <NextIntlClientProvider>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
