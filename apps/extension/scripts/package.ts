import { execFileSync } from "child_process";
import { mkdirSync, readFileSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

type Browser = "chrome" | "firefox";
type PackageTarget = Browser | "all";

interface ExtensionManifest {
  version: string;
}

const browsers = ["chrome", "firefox"] as const;
const target = (process.argv[2] ?? "all") as PackageTarget;
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const distRoot = join(root, "dist");
const artifactsDir = join(root, "artifacts");

if (target !== "all" && !browsers.includes(target)) {
  throw new Error(`Unknown package target "${target}". Use chrome, firefox, or all.`);
}

const selectedBrowsers: readonly Browser[] = target === "all" ? browsers : [target];

const readManifest = (browser: Browser): ExtensionManifest => {
  const manifestPath = join(distRoot, browser, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Partial<ExtensionManifest>;

  if (typeof manifest.version !== "string" || manifest.version.trim() === "") {
    throw new Error(`Missing extension version in ${manifestPath}.`);
  }

  return { version: manifest.version };
};

const runPnpmCommand = (command: string): void => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", command], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    return;
  }

  execFileSync("sh", ["-c", command], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

const cleanPresenceBuildCache = (): void => {
  runPnpmCommand("pnpm presence:clean");
};

const runBuild = (browser: Browser): void => {
  runPnpmCommand(`pnpm --filter @nowly/extension build:${browser}`);
};

const powershellLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`;

const createZip = (sourceDir: string, outputPath: string): void => {
  if (process.platform === "win32") {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          `$source = ${powershellLiteral(sourceDir)}`,
          `$dest = ${powershellLiteral(outputPath)}`,
          "if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Force }",
          "Compress-Archive -Path (Join-Path $source '*') -DestinationPath $dest -Force",
        ].join("; "),
      ],
      { stdio: "inherit" },
    );
    return;
  }

  execFileSync("zip", ["-qr", outputPath, "."], {
    cwd: sourceDir,
    stdio: "inherit",
  });
};

const packageBrowser = (browser: Browser): void => {
  runBuild(browser);
  mkdirSync(artifactsDir, { recursive: true });

  const manifest = readManifest(browser);
  const artifactPath = join(artifactsDir, `nowly-${browser}-v${manifest.version}.zip`);

  createZip(join(distRoot, browser), artifactPath);
  process.stdout.write(`Packaged ${browser}: ${relative(root, artifactPath)}\n`);
};

cleanPresenceBuildCache();

for (const browser of selectedBrowsers) {
  packageBrowser(browser);
}
