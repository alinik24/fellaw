#!/usr/bin/env node
/**
 * PR-01 production fabricated-state guard.
 *
 * Scans FelLaw production frontend source (pages + components) for known
 * patterns that indicate fabricated customer / matter / professional /
 * financial / partner / success-outcome state, OR deep-links/redirects to
 * removed pages. Explicit test/story/dev-fixture locations are allowed.
 *
 * Run:  npm run check:fabricated
 * Fail: non-zero exit when a forbidden marker is found in production scope.
 *
 * Intentionally conservative: patterns must be semantically meaningful, and
 * whitelisted file paths (tests, fixtures, stories, dev-fixtures) are skipped
 * so legitimate test fixtures are not flagged.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'src');

// Directories / extensions treated as test-only (allowed to hold synthetic data).
const ALLOWED_DIR_PARTS = ['/test/', '/dev-fixtures/', '/stories/', '/__tests__/', '.story.'];
const IN_PRODUCTION = /\.(ts|tsx)$/;

// Forbidden markers -> reason. Keep the list semantic, not a literal-string trap.
const FORBIDDEN = [
  [/mockCaseData|mockLawFirm|mockLawyerData|mockCases|mockRevenue/, 'mock customer/matter/professional/business data'],
  [/successProbability|outcomePrediction/, 'invented success/outcome probability'],
  [/thisMonthRevenue|monthlyRevenue|revenueFabricated/, 'fabricated monthly revenue'],
  [/98%\s*(Success Rate|Success|Erfolg)/i, 'fabricated success-rate boast'],
  [/15,000\+\s*(Cases|cases|Fälle)|15,000\+\s*Fälle/i, 'fabricated total-cases boast'],
  [/€2\.3M|2\.3M\s*(EUR|€)/, 'fabricated cost-savings boast'],
  [/['"]based on similar cases['"]|high probability of success|hohe Erfolgswahrscheinlichkeit/i, 'invented similar-case / success-likelihood claim'],
  [/successfully challenged|many rent increases have been successfully/i, 'invented outcome claim'],
  [/AI will analyze|will analyze your|Analyze My (Traffic|Consumer|Case|Employment|Family|Immigration)|Uploaded & Analyzed/i, 'non-performing AI-analysis claim'],
];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) acc = walk(full, acc);
    else if (IN_PRODUCTION.test(entry)) acc.push(full);
  }
  return acc;
}

function isAllowed(file) {
  // Normalize to forward slashes so the dir-part allowlist works on Windows too.
  const rel = file.replace(SRC, '').replaceAll('\\', '/');
  return ALLOWED_DIR_PARTS.some((part) => rel.includes(part));
}

let failed = false;
const relName = (f) => f.replace(SRC + '/', '');
for (const file of walk(SRC)) {
  if (isAllowed(file)) continue;
  const code = readFileSync(file, 'utf8');
  for (const [re, reason] of FORBIDDEN) {
    if (re.test(code)) {
      failed = true;
      console.error(`[fabricated-state] ${reason}: ${relName(file)}`);
    }
  }
}

if (failed) {
  console.error('\npm run check:fabricated: FAILED — prohibited fabricated-state marker(s) found.\nFix by removing the fabricated state or moving it to an explicit fixture.')
  process.exit(1);
}
console.log('check:fabricated: OK — no fabricated-state markers in production source.');
