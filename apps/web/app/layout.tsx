import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import { Geist, Instrument_Sans } from "next/font/google";
import type { PropsWithChildren, ReactElement } from "react";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"]
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

const APP_NAME = "Nowly";
const APP_DEFAULT_TITLE = "Nowly | Automatic Discord Rich Presence";
const APP_DESCRIPTION = "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

const RootLayout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${instrumentSans.variable} ${geist.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
