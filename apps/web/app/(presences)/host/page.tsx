import { HostContent } from "@/components/host/host-content";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly Host App for Windows, macOS and Linux",
    description: "Download the Nowly native host app for Windows, macOS or Linux to connect your browser extension with Discord Rich Presence.",
    path: "/host",
    keywords: ["Discord Rich Presence host app", "Nowly Windows app", "Nowly macOS app", "Nowly Linux app"],
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