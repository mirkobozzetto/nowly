import type { Metadata, Viewport } from "next";

const APP_NAME = "Nowly";
const APP_DEFAULT_TITLE = "Nowly | Automatic Discord Rich Presence";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_DEFAULT_TITLE,
  description: "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
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
    title: APP_DEFAULT_TITLE,
    description:
      "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_DEFAULT_TITLE,
    description:
      "Automatically display what you're watching in your Discord status. YouTube, Twitch, Disney+, Apple TV+, Prime Video and more.",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};
