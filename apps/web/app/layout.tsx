import { AdblockNotice } from "@/components/layout/adblock-notice";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";
import { ADSENSE_ENABLED } from "@/lib/constants";
import { Providers } from "@/providers/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren, ReactElement } from "react";
import { geist, instrumentSans } from "./fonts";
import "./globals.css";
import { metadata, viewport } from "./metadata";

export { metadata, viewport };

const Layout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${instrumentSans.variable} ${geist.variable} bg-background scroll-smooth`}
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="flex min-h-screen min-w-0 flex-col">
              <Navbar />
              <main className="flex min-w-0 flex-1 flex-col">{children}</main>
              <Footer />
            </div>

            <Toaster />
            <AdblockNotice enabled={ADSENSE_ENABLED} />
            <CookieBanner />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default Layout;
