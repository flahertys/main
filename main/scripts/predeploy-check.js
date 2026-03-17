const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectIdFile = path.join(process.cwd(), '.project-id');
if (!fs.existsSync(projectIdFile)) {
  console.error('ERROR: .project-id not found. Aborting deploy.');
  process.exit(1);
}
const projectId = fs.readFileSync(projectIdFile, 'utf8').trim();
console.log('Deploying project:', projectId);

// Check git remote
try {
  const remotes = execSync('git remote -v').toString();
  if (!remotes.includes('DarkModder33/main')) {
    console.warn('WARNING: Git remote does not match expected repo.');
  }
} catch (e) {
  console.warn('WARNING: Could not check git remote.');
}

// Check for Vercel config
const vercelConfig = path.join(process.cwd(), 'vercel.json');
if (!fs.existsSync(vercelConfig)) {
  console.warn('WARNING: vercel.json not found. Make sure Vercel project is correct.');
}

console.log('Predeploy check complete.');

