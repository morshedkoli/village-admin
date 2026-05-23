import fs from "node:fs";
import path from "node:path";
import LandingPageClient from "./LandingPageClient";

interface ApkInfo {
  sizeMB: string;
  updatedAt: string;
  version: string;
}

/**
 * Read the APK file metadata at request time so the download CTA can show
 * an accurate size + "last updated" timestamp without bundling it.
 */
function readApkInfo(): ApkInfo {
  let sizeMB = "—";
  let updatedAt = "—";

  try {
    const apkPath = path.join(
      process.cwd(),
      "public",
      "apps",
      "al_islah.apk"
    );
    const stat = fs.statSync(apkPath);
    sizeMB = `${(stat.size / (1024 * 1024)).toFixed(1)} MB`;
    updatedAt = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(stat.mtime);
  } catch {
    // If the APK isn't present yet, leave defaults so the page still renders.
  }

  return { sizeMB, updatedAt, version: "1.0.0" };
}

export default function LandingPage() {
  return <LandingPageClient apkInfo={readApkInfo()} />;
}
