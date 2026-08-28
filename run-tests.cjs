const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const vitestBin = path.join(__dirname, 'node_modules', '.bin', 'vitest.cmd');

try {
  const result = execSync(`"${vitestBin}" run`, { encoding: 'utf8', timeout: 120000 });
  fs.writeFileSync(path.join(__dirname, 'vitest-output.txt'), result);
  process.exit(0);
} catch (e) {
  fs.writeFileSync(path.join(__dirname, 'vitest-output.txt'), (e.stdout || '') + (e.stderr || ''));
  process.exit(1);
}
