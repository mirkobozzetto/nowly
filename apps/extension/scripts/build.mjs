import react from "@vitejs/plugin-react";
import { build } from "vite";
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const buildPage = async (name) => {
  await build({
    root: join(ROOT, "src", name),
    base: "./",
    plugins: [react()],
    build: {
      outDir: join(DIST, name),
      emptyOutDir: true,
      rollupOptions: {
        input: join(ROOT, "src", name, "index.html"),
      },
    },
    configFile: false,
  });
};

const buildScript = async (name, entry) => {
  await build({
    root: ROOT,
    build: {
      outDir: DIST,
      emptyOutDir: false,
      lib: {
        entry,
        formats: ["iife"],
        name: `__presences_${name}`,
        fileName: () => `${name}.js`,
      },
      rollupOptions: {
        external: [],
      },
    },
    configFile: false,
  });
};

const copyManifest = () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf-8"));
  manifest.background.service_worker = "background.js";
  delete manifest.background.type;
  manifest.content_scripts[0].js = ["content.js"];
  manifest.action.default_popup = "popup/index.html";
  delete manifest.action.default_popup;
  manifest.side_panel.default_path = "sidepanel/index.html";
  manifest.icons = {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  };
  manifest.action.default_icon = { ...manifest.icons };
  writeFileSync(join(DIST, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
};

const copyStatic = () => {
  mkdirSync(join(DIST, "icons"), { recursive: true });
  for (const size of [16, 48, 128]) {
    copyFileSync(
      join(ROOT, "src", "icons", `icon${size}.png`),
      join(DIST, "icons", `icon${size}.png`),
    );
  }
  copyFileSync(join(ROOT, "..", "web", "public", "app_title_white.png"), join(DIST, "app_title_white.png"));
  cpSync(join(ROOT, "_locales"), join(DIST, "_locales"), { recursive: true });
};

await buildPage("popup");
await buildPage("sidepanel");
await buildScript("background", join(ROOT, "src", "background", "index.ts"));
await buildScript("content", join(ROOT, "src", "content", "index.ts"));
copyManifest();
copyStatic();
