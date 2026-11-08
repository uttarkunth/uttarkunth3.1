import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const openNextDir = path.join(rootDir, ".open-next");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
console.log(`[cloudflare-build] Building ${packageJson.name}@${packageJson.version}`);

function run(command, env) {
  console.log(`[cloudflare-build] Running: ${command}`);
  execSync(command, {
    stdio: "inherit",
    cwd: rootDir,
    env,
  });
}

// OpenNext normally sets these private Next.js flags before invoking the Next build.
// Set the same values here because this script performs the Next build explicitly.
const buildEnv = {
  ...process.env,
  NEXT_PRIVATE_STANDALONE: "true",
  NEXT_PRIVATE_OUTPUT_TRACE_ROOT: rootDir,
};

// Remove only the generated OpenNext bundle. Keep source files and the Next.js build
// inputs untouched; Next.js will refresh its own .next output in the next step.
console.log("[cloudflare-build] Cleaning previous Cloudflare bundle (.open-next)...");
fs.rmSync(openNextDir, { recursive: true, force: true });

// Step 1: Run the actual Next.js production build explicitly.
run("npx next build", buildEnv);

// Step 2: Transform the completed Next.js output into a Cloudflare Worker.
// --skipNextBuild is essential: it prevents OpenNext from invoking package.json's
// build script a second time and removes the recursive-build failure mode.
run(
  "npx @opennextjs/cloudflare build --skipNextBuild --dangerouslyUseUnsupportedNextVersion",
  buildEnv
);

const workerPath = path.join(openNextDir, "worker.js");
if (!fs.existsSync(workerPath)) {
  throw new Error(
    "[cloudflare-build] OpenNext finished without generating .open-next/worker.js"
  );
}

console.log("[cloudflare-build] Success: .open-next/worker.js was generated.");
