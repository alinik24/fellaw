import '@testing-library/jest-dom/vitest';

// jsdom lacks fetch/streams needed by the platform client; the contract tests
// stub global fetch anyway. This guard just makes the absence explicit.
if (typeof globalThis.fetch === 'undefined') {
  // eslint-disable-next-line no-console
  console.warn('jsdom: global fetch absent — tests must stub it');
}
