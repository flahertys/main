#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SUITE_PATH = path.join(ROOT, "data", "tradebot", "eval-suite.jsonl");
const RESPONSES_PATH = path.join(ROOT, "data", "tradebot", "eval-responses.jsonl");
const OUT_PATH = path.join(ROOT, "data", "tradebot", "eval-score.json");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(ROOT, filePath)}`);
  }

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      fail(`Invalid JSON at ${path.relative(ROOT, filePath)}:${index + 1}`);
      return null;
    }
  });
}

function containsAny(text, words) {
  const lc = text.toLowerCase();
  return words.some((w) => lc.includes(String(w).toLowerCase()));
}

function scoreResponse(scenario, responseText) {
  const text = String(responseText || "").toLowerCase();

  const structureTerms = ["bias", "trigger", "invalidation", "position", "risk"];
  const structureHits = structureTerms.filter((t) => text.includes(t)).length;
  const structure = structureHits / structureTerms.length;

  const risk = containsAny(text, ["stop", "position size", "max loss", "kill-switch", "drawdown"]) ? 1 : 0.4;
  const macroMicro = containsAny(text, ["macro", "fed", "inflation", "yield"]) && containsAny(text, ["micro", "order book", "spread", "depth", "delta"]) ? 1 : 0.4;
  const options = containsAny(text, ["options", "put", "call", "gamma", "open interest", "skew"]) ? 1 : 0.35;

  const indicatorHits = scenario.expected.requiredIndicators.filter((ind) => text.includes(String(ind).toLowerCase())).length;
  const indicatorGrounding = indicatorHits / Math.max(1, scenario.expected.requiredIndicators.length);

  const personaQuality = scenario.persona === "learner"
    ? (containsAny(text, ["learning", "checklist", "beginner", "step-by-step"]) ? 1 : 0.45)
    : (containsAny(text, ["desk", "execution", "protocol", "risk controls"]) ? 1 : 0.45);

  const weights = scenario.rubricWeights;
  const total =
    structure * weights.structure +
    risk * weights.riskDiscipline +
    macroMicro * weights.macroMicroAlignment +
    options * weights.optionsFlowUse +
    indicatorGrounding * weights.indicatorGrounding +
    personaQuality * weights.personaQuality;

  return {
    score: Number(total.toFixed(4)),
    components: {
      structure: Number(structure.toFixed(3)),
      riskDiscipline: Number(risk.toFixed(3)),
      macroMicroAlignment: Number(macroMicro.toFixed(3)),
      optionsFlowUse: Number(options.toFixed(3)),
      indicatorGrounding: Number(indicatorGrounding.toFixed(3)),
      personaQuality: Number(personaQuality.toFixed(3)),
    },
  };
}

function main() {
  const suite = parseJsonl(SUITE_PATH);
  const responses = parseJsonl(RESPONSES_PATH);

  const byId = new Map(responses.map((row) => [row.id, row]));

  const scored = suite.map((scenario) => {
    const response = byId.get(scenario.id);
    if (!response || typeof response.response !== "string") {
      return {
        id: scenario.id,
        score: 0,
        missing: true,
      };
    }

    return {
      id: scenario.id,
      ...scoreResponse(scenario, response.response),
      missing: false,
    };
  });

  const valid = scored.filter((row) => !row.missing);
  const overall = valid.length > 0 ? valid.reduce((sum, row) => sum + row.score, 0) / valid.length : 0;

  const report = {
    generatedAt: new Date().toISOString(),
    scenarios: suite.length,
    scored: valid.length,
    missing: scored.filter((row) => row.missing).map((row) => row.id),
    overallScore: Number(overall.toFixed(4)),
    results: scored,
    thresholds: {
      pass: 0.75,
      caution: 0.62,
    },
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("✅ Tradebot eval scoring complete");
  console.log(`Overall score: ${report.overallScore}`);
  console.log(`Report: ${OUT_PATH}`);
}

main();
