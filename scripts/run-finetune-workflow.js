// scripts/run-finetune-workflow.js - Node wrapper to run Python fine-tune for TradeHax
const { exec } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'fine-tune-mistral-lora.py');

exec(`python ${scriptPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing fine-tune: ${error}`);
    return;
  }
  console.log(`Fine-tune output: ${stdout}`);
  if (stderr) console.error(`Warnings: ${stderr}`);
});

// Run via: node scripts/run-finetune-workflow.js
