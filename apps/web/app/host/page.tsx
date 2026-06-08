import { HostContent } from "@/components/host/host-content";
import type { Metadata } from "next";
import type { FC, ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return {
    title: "Host App — Nowly",
    description: "Download the Nowly native host application for Windows to connect your browser extension with Discord.",
    openGraph: {
      title: "Host App — Nowly",
      description: "Download the Nowly native host application for Windows to connect your browser extension with Discord.",
    },
  };
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