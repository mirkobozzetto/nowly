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