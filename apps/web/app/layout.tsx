import { getLocale } from "next-intl/server";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { PropsWithChildren, ReactElement } from "react";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"]
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"]
});

const RootLayout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
