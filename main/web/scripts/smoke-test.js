import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const required = [
  "index.html",
  "package.json",
  "vite.config.js",
  "vercel.json",
  path.join("public", "__health"),
  path.join("src", "main.jsx"),
  path.join("src", "App.jsx"),
  path.join("src", "TradeHaxFinal.jsx")
];

let failed = false;
for (const rel of required) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${rel}`);
    failed = true;
  }
}

const appPath = path.join(root, "src", "App.jsx");
if (fs.existsSync(appPath)) {
  const appText = fs.readFileSync(appPath, "utf8");
  if (!appText.includes("export default function App")) {
    console.error("App component export not found in App.jsx.");
    failed = true;
  }
}

const vercelPath = path.join(root, "vercel.json");
if (fs.existsSync(vercelPath)) {
  const vercelText = fs.readFileSync(vercelPath, "utf8");
  const hasSpaFallback =
    vercelText.includes('"destination": "/index.html"') ||
    vercelText.includes('"dest": "/index.html"');
  if (!hasSpaFallback) {
    console.error("SPA fallback route to /index.html not found in vercel.json.");
    failed = true;
  }
  if (!vercelText.includes('"source": "/__health"')) {
    console.error("Health endpoint header/route for /__health not found in vercel.json.");
    failed = true;
  }
  if (!vercelText.includes('"source": "/tradehax"')) {
    console.error("/tradehax redirect rule not found in vercel.json.");
    failed = true;
  }
}

const componentPath = path.join(root, "src", "TradeHaxFinal.jsx");
if (fs.existsSync(componentPath)) {
  const text = fs.readFileSync(componentPath, "utf8");
  if (!text.includes("export default function TradeHaxGPT")) {
    console.error("TradeHax component default export not found.");
    failed = true;
  }
  if (text.includes("api.anthropic.com")) {
    console.error("Anthropic endpoint still present in TradeHax component.");
    failed = true;
  }
  if (!text.includes('from "ethers"')) {
    console.error("ethers import missing from TradeHax component.");
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Smoke test passed.");
