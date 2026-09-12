/**
 * PR-01 fabricated-state guard test.
 *
 * Runs scripts/check-fabricated-state.mjs (node) against the production
 * frontend source and requires it to pass. The script scans src/pages and
 * src/components for markers of fabricated customer/matter/professional/
 * financial/partner/success-outcome state and fails if any appears outside
 * explicit test/fixture/story locations.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const script = resolve(root, 'scripts/check-fabricated-state.mjs');

describe('PR-01 fabricated-state guard', () => {
  it('passes against the current production source', () => {
    let stdout = '';
    let stderr = '';
    try {
      stdout = execFileSync('node', [script], { encoding: 'utf8', cwd: root });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      stderr = (e.stderr || e.stdout || '').toString();
    }
    expect(stderr, `guard failed:\n${stderr}\n${stdout}`).toBe('');
  });
});
