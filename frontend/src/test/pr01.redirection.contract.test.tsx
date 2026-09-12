/**
 * PR-01 redirection + consumer-safety contract test.
 *
 * Verifies, structurally against the real App.tsx route table and the real
 * page directory, that every removed/fabricated route is redirected to a safe
 * live destination and that no production page deep-links to a removed page.
 * This is the regression guard for "no navigation item may lead to a 404" and
 * "no reachable production page exposes fabricated state."
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
const pagesDir = resolve(__dirname, '../pages');

// (removed route path -> required safe redirect target)
const REMOVED_TO_SAFE: Record<string, string> = {
  '/case-assessment/:caseId': '/user/dashboard',
  '/self-service': '/',
  '/ongoing-cases': '/user/dashboard',
  '/graybeard-mediation': '/',
  '/law-firms': '/',
  '/insurance': '/',
  '/work-with-us/professionals': '/',
  '/work-with-us/careers': '/',
  '/dashboard': '/',
  '/lawyer/dashboard': '/',
};

// PR-01C: the five non-persistent specialized intake funnels are removed;
// their legacy URLs resolve to the canonical persisted intake.
const REMOVED_FUNNELS_TO_CANONICAL: Record<string, string> = {
  '/new-case/traffic-violation': '/new-case',
  '/new-case/consumer-dispute': '/new-case',
  '/new-case/family-inquiry': '/new-case',
  '/new-case/employment-inquiry': '/new-case',
  '/new-case/visa-immigration': '/new-case',
};

describe('PR-01 route redirection (removed surfaces → safe destinations)', () => {
  for (const [path, safe] of Object.entries(REMOVED_TO_SAFE)) {
    it(`redirects ${path} → ${safe}`, () => {
      // The removed route is still declared (so old bookmarks don't 404) ...
      expect(appSource).toContain(`path="${path}"`);
      // ... and it resolves through a <Navigate> to a live, state-backed route.
      expect(appSource).toContain(`Navigate to="${safe}"`);
      // The removed path MUST resolve to a <Navigate> redirect (never a page component).
      const routeLine = appSource.split('\n').find((l) => l.includes(`path="${path}"`));
      expect(routeLine).toBeTruthy();
      expect(routeLine!).toContain('<Navigate to=');
      expect(routeLine!).not.toMatch(/element={<(?!Navigate)/);
    });
  }
});

describe('PR-01C specialized funnel removal (legacy URLs → canonical persisted intake)', () => {
  for (const [path, canonical] of Object.entries(REMOVED_FUNNELS_TO_CANONICAL)) {
    it(`redirects ${path} → ${canonical}`, () => {
      expect(appSource).toContain(`path="${path}"`);
      expect(appSource).toContain(`Navigate to="${canonical}"`);
      const routeLine = appSource.split('\n').find((l) => l.includes(`path="${path}"`));
      expect(routeLine).toBeTruthy();
      expect(routeLine!).toContain('<Navigate to=');
      expect(routeLine!).not.toMatch(/element={<(?!Navigate)/);
    });
  }
});

describe('PR-01 fabricated surface removal', () => {
  const REMOVED_PAGES = [
    'CaseAssessment.tsx',
    'OngoingCases.tsx',
    'LawyerDashboard.tsx',
    'SelfService.tsx',
    'LawFirms.tsx',
    'Insurance.tsx',
    'GraybeardMediation.tsx',
    'Careers.tsx',
    'LawyerOnboarding.tsx',
    'IndexOld.tsx',
    // PR-01C: non-persistent specialized funnels (no test/dev consumer; Git history is the archive).
    'NewCaseTrafficViolation.tsx',
    'NewCaseConsumerDispute.tsx',
    'NewCaseEmploymentInquiry.tsx',
    'NewCaseFamilyInquiry.tsx',
    'NewCaseVisaImmigration.tsx',
  ];

  for (const file of REMOVED_PAGES) {
    it(`no longer ships ${file}`, () => {
      expect(readdirSync(pagesDir)).not.toContain(file);
    });
  }

  it('no remaining page deep-links to a removed route', () => {
    const removedLiterals = [
      '/case-assessment/',
      '/ongoing-cases',
      '/self-service',
      '/graybeard-mediation',
      '/law-firms',
      '/insurance',
      '/work-with-us/professionals',
      '/work-with-us/careers',
      '/lawyer/dashboard',
      // PR-01C: specialized funnel route literals (legacy URLs redirect; no page may link to them).
      '/new-case/traffic-violation',
      '/new-case/consumer-dispute',
      '/new-case/family-inquiry',
      '/new-case/employment-inquiry',
      '/new-case/visa-immigration',
    ];
    for (const file of readdirSync(pagesDir)) {
      if (!file.endsWith('.tsx')) continue;
      const src = readFileSync(join(pagesDir, file), 'utf8');
      for (const literal of removedLiterals) {
        expect(src, `${file} must not reference removed route ${literal}`).not.toContain(literal);
      }
    }
  });

  it('honest redirect targets are the real persisted case/dashboard surface', () => {
    // The citizen intent surfaces on the state-backed overview, which is what
    // UserDashboard (kept) renders — not a fabricated per-matter page.
    expect(appSource).toContain('<Route path="/user/dashboard" element={<UserDashboard />} />');
    expect(REMOVED_TO_SAFE['/case-assessment/:caseId']).toBe('/user/dashboard');
    expect(REMOVED_TO_SAFE['/ongoing-cases']).toBe('/user/dashboard');
  });
});

describe('PR-01C honest intake contract', () => {
  it('no production source promises an AI/case analysis on a non-performing path', () => {
    // Scans every production page component + App: no "AI will analyze",
    // "Analyze My ...", or "Uploaded & Analyzed" claim may remain on a path
    // that does not actually perform the analysis.
    const claims = [
      'AI will analyze',
      'Analyze My ',
      'will analyze your',
      'Uploaded & Analyzed',
    ];
    for (const file of readdirSync(pagesDir)) {
      if (!file.endsWith('.tsx')) continue;
      const src = readFileSync(join(pagesDir, file), 'utf8');
      for (const claim of claims) {
        expect(src, `${file} must not promise ${claim} without performing it`).not.toContain(claim);
      }
    }
    for (const claim of claims) {
      expect(appSource, `App.tsx must not promise ${claim}`).not.toContain(claim);
    }
  });

  it('the canonical /new-case route performs the real persisted case-create call', () => {
    // The canonical intake is NewCase.tsx (kept), which must call the real
    // createCase() API (persisted HTTP POST), not a local-only redirect.
    const newCaseSource = readFileSync(join(pagesDir, 'NewCase.tsx'), 'utf8');
    expect(newCaseSource).toMatch(/createCase\(/);
    expect(newCaseSource).toMatch(/navigate\('\/user\/dashboard'\)/);
    // And App.tsx binds /new-case to that component (not a redirect).
    expect(appSource).toContain('<Route path="/new-case" element={<NewCase />} />');
    expect(appSource).not.toContain('<Route path="/new-case" element={<Navigate');
  });
});
