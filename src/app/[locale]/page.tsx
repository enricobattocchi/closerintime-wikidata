import { setRequestLocale } from "next-intl/server";
import Chooser from "@/components/Chooser/Chooser";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Chooser selectedEvents={[]} />;
}
