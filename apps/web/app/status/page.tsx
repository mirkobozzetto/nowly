import { StatusContent } from "@/components/status/status-content";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly Status",
    description: "Service status for Nowly website, API, presence library and host downloads.",
    path: "/status",
  });
};

export { generateMetadata };
export default StatusContent;
