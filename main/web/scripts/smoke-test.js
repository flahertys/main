import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const required = [
  "index.html",
  "package.json",
  "vite.config.js",
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
  if (!appText.includes('path="/tradehax"')) {
    console.error("Router page /tradehax route not found in App.jsx.");
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
  if (!text.startsWith('"use client";')) {
    console.error('TradeHax component missing "use client" directive.');
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
