import { getDocsNav, getDocContent } from "@/lib/docs/content";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
  const sections = getDocsNav();
  const lines: string[] = [
    "# Nowly Documentation",
    "> Automatically update your Discord status with what you're watching on streaming platforms.",
    "",
    "## Documentation",
    "",
  ];

  for (const section of sections) {
    for (const page of section.children) {
      const doc = getDocContent(`${section.slug}/${page.slug}`, "en-US");
      if (!doc) continue;

      lines.push(`- [${doc.title}](https://nowly.me/docs/${doc.path}): ${doc.description || "Documentation for " + doc.title}`);
    }
  }

  lines.push("", "## Resources", "", "- [GitHub Repository](https://github.com/q-kimi/nowly)", "- [Discord Rich Presence](https://discord.com/rich-presence)");

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
