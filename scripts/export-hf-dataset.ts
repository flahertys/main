import { exportFineTuningJsonl, getBehaviorIngestionSummary } from "../lib/ai/data-ingestion";
import * as fs from 'fs';
import * as path from 'path';

/**
 * TradeHax HF Dataset Exporter
 * Runs as a standalone script to generate training sets for GLM-4.7 Flash.
 */
function exportDataset() {
  console.log("--- TradeHax AI Dataset Export ---");
  
  const datasetPath = path.join(process.cwd(), 'ai-training-set.jsonl');
  const data = exportFineTuningJsonl({
    includeBootstrap: true,
    maxRows: 25_000,
  });
  const summary = getBehaviorIngestionSummary(7 * 24 * 60);
  const rows = data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  
  try {
    fs.writeFileSync(datasetPath, data);
    console.log(`SUCCESS: Dataset exported to ${datasetPath}`);
    console.log(`TOTAL_SAMPLES: ${rows.length}`);
    console.log(`RUNTIME_ACCEPTED_EVENTS: ${summary.acceptedEvents}`);
    console.log(`RUNTIME_TRAINING_EVENTS: ${summary.trainingEligibleEvents}`);
    console.log("NEXT_STEP: Upload to Hugging Face (Hackavelli88/TradeHax) and run AutoTrain with GLM-4.7-Flash-Uncensored.");
  } catch (error) {
    console.error("FAILURE: Could not export dataset.", error);
  }
}

exportDataset();
