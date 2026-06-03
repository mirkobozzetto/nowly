import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/l-ui/sonner";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactElement, ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}>;

const generateStaticParams = (): Array<{ locale: string }> => {
  return routing.locales.map((locale) => ({ locale }));
};

const generateMetadata = (): Metadata => {
  return {
    title: "Nowly | Automatic Discord Rich Presence",
    description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
    openGraph: {
      type: "website",
      siteName: "Nowly",
      title: "Nowly | Automatic Discord Rich Presence",
      description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Nowly | Automatic Discord Rich Presence",
      description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
    },
    alternates: {
      canonical: "/",
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}`])
      ),
    },
  };
};

const LocaleLayout = async ({ children, params }: Props): Promise<ReactElement> => {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </NextIntlClientProvider>
  );
};

export { generateMetadata, generateStaticParams };
export default LocaleLayout;
