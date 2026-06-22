import { HostContent } from "@/components/host/host-content";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly Host for Windows and Linux",
    description: "Download Nowly Host for Windows or Linux to connect your Chromium-based browser extension with Discord Rich Presence.",
    path: "/host",
    keywords: ["Discord Rich Presence Nowly Host", "Nowly Host Windows", "Nowly Host Linux"],
  });
};

const Page: FC = (): ReactElement => {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <HostContent />
    </main>
  );
};

export { generateMetadata };

export default Page;