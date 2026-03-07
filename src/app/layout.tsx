import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/Header";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "#closerintime",
    template: "%s #closerintime",
  },
  description: "Visualize the time between historical events.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "closerintime",
    description: "Visualize the time between historical events.",
    siteName: "closerintime",
  },
  twitter: {
    card: "summary",
    title: "closerintime",
    description: "Visualize the time between historical events.",
  },
};

export const viewport: Viewport = {
  themeColor: "#8B2252",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sourceSerif.variable}>
      <body>
        <Header />
        {children}
        <footer
          style={{
            textAlign: "center",
            padding: "32px 16px 24px",
            fontSize: "0.8rem",
            color: "var(--color-text-light)",
          }}
        >
          A progressive web app from{" "}
          <a href="https://lopo.it" rel="author noopener" target="_blank" style={{ color: "var(--color-primary)" }}>
            Lopo.it
          </a>
          {" "}&middot;{" "}
          <a href="https://github.com/enricobattocchi/closerintime-node" rel="noopener" target="_blank" style={{ color: "var(--color-primary)" }}>
            GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
