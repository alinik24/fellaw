/**
 * T2 — Frontend contract tests for assistant parity.
 *
 * Truth source: the real backend capability registry, snapshotted as
 * capabilities.anonymous.json from app.services.platform_capabilities
 * (capabilities_for_role('anonymous')) at test-authoring time.
 *
 * Doctrine: these are behavioral component tests — the assistant UI must
 * render ONLY what the registry-backed contract supplies, never invent
 * capabilities, and stay honest about status. No simulated success states.
 */
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChatAssistant } from '@/components/ChatAssistant';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { fetchCapabilities, matchCapability } from '@/lib/api/platform';
import type { Capability } from '@/lib/api/platform';
import fixture from './fixtures/capabilities.anonymous.json';

// ---- Real registry fixture (backend truth) --------------------------------

// The JSON snapshot widens literal unions to `string`; cast to Capability[]
// so the contract helpers get the correct typed shape.
const registry: Capability[] = fixture.capabilities as Capability[];

// Registry truth: anonymous users must never be advertised missing/planned caps
if (registry.some((c) => c.status === 'missing' || c.status === 'planned')) {
  throw new Error('registry fixture violated: anonymous role has missing/planned caps');
}
// PR-01: removed (fabricated/frozen) capabilities must NOT be advertised to a role.
if (registry.some((c) => c.status === 'removed')) {
  throw new Error('registry fixture violated: anonymous role has a removed (fabricated) capability');
}

// The exact chip population the component is allowed to render
const allowedChips = registry.filter((c) => c.kind !== 'mutation' && c.status !== 'missing' && c.status !== 'removed').slice(0, 6);

// ---- Stubs: platform client fetch layer only (registry data is real) -------

vi.mock('@/lib/api/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/platform')>();
  // Fixture must be imported INSIDE the factory: vi.mock factories are hoisted
  // above top-level imports, so referencing the outer `fixture` binding throws.
  const { default: fixture } = await import('./fixtures/capabilities.anonymous.json');
  return {
    ...actual,
    fetchCapabilities: vi.fn().mockResolvedValue(fixture as unknown as Awaited<ReturnType<typeof fetchCapabilities>>),
    fetchOverview: vi.fn().mockImplementation(() => Promise.reject(new Error('not signed in'))),
    sendChatMessage: vi.fn(),
  };
});

import { sendChatMessage } from '@/lib/api/platform';

// jsdom lacks fetch; any unmocked call must be a loud, explicit failure.
const fetchMock = vi.fn().mockRejectedValue(new Error('unexpected fetch — all API calls must go through the mocked client'));
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  vi.clearAllMocks();
});

function renderAssistant() {
  return render(
    <LanguageProvider>
      <MemoryRouter>
        <ChatAssistant onClose={() => undefined} />
      </MemoryRouter>
    </LanguageProvider>,
  );
}

// ---------------------------------------------------------------------------
// Pure contract: keyword → capability mapping mirrors the Telegram bot table
// ---------------------------------------------------------------------------

describe('matchCapability contract (same intents as the Telegram bot)', () => {
  it('routes urgent keywords to urgent_help', () => {
    const cap = matchCapability('Ich muss dringend einen Anwalt rufen, Notfall!', registry);
    expect(cap?.id).toBe('urgent_help');
  });

  it('routes lawyer keywords to find_lawyer', () => {
    const cap = matchCapability('Wie finde ich einen Anwalt?', registry);
    expect(cap?.id).toBe('find_lawyer');
  });

  it('returns null when no intent matches', () => {
    expect(matchCapability('Erzähl mir einen Witz', registry)).toBeNull();
  });

  it('only routes to capabilities that exist in the registry (no invented ids)', () => {
    for (const input of ['Notfall', 'Anwalt', 'neuer Fall', 'meine Fälle', 'Dokument hochladen', 'Rechtsschutz', 'Schlichtung', 'Vorlage', 'Kosten', 'Termin buchen']) {
      const cap = matchCapability(input, registry);
      // Either no match, or a real registry id — never an invented one.
      if (cap) {
        expect(registry.some((c) => c.id === cap.id)).toBe(true);
      }
    }
  });

  it('citizen-only intents are absent from the anonymous registry (parity: bot and web use the same role filter)', () => {
    // my_cases/upload/pay/book are citizen- or lawyer-scoped in the backend
    // registry; the anonymous snapshot must not contain them.
    for (const id of ['my_cases', 'upload_document', 'pay_consultation', 'book_consultation']) {
      expect(registry.some((c) => c.id === id)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Component contract: the assistant renders registry-backed capabilities only
// ---------------------------------------------------------------------------

describe('ChatAssistant parity rendering (real anonymous registry)', () => {
  it('renders exactly the allowed registry capability chips', async () => {
    renderAssistant();
    const chips = await screen.findAllByTestId('capability-chip');
    expect(chips.length).toBe(allowedChips.length);

    // The chip labels come from the registry, not from UI-invented copy.
    const labels = chips.map((el) => el.textContent);
    for (const label of labels) {
      expect(registry.some((c) => c.label_en === label || c.label_de === label)).toBe(true);
    }
  });

  it('each chip href equals the registry web_route (deep-link parity)', async () => {
    renderAssistant();
    const chips = await screen.findAllByTestId('capability-chip');
    const routes = allowedChips.map((c) => c.web_route);
    chips.forEach((chip) => {
      const href = chip.getAttribute('href');
      expect(routes).toContain(href);
    });
  });

  it('never renders a chip for a missing/planned capability', async () => {
    renderAssistant();
    const chips = await screen.findAllByTestId('capability-chip');
    const forbidden = fixture.capabilities.filter((c) => c.status === 'missing' || c.status === 'planned');
    for (const f of forbidden) {
      expect(chips.some((chip) => chip.textContent === (f.label_en || f.label_de))).toBe(false);
    }
  });

  it('renders the role from the registry response (anonymous)', async () => {
    renderAssistant();
    await waitFor(() => {
      expect(screen.getByText('anonymous')).toBeTruthy();
    });
  });

  it('shows honest unauthenticated ask-path: sign-in prompt, no fabricated answer', async () => {
    localStorage.removeItem('access_token');
    renderAssistant();
    const input = screen.getByPlaceholderText(/Ask about German law/i);
    await userEvent.type(input, 'Was gilt bei fristloser Kündigung?');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText(/Sign in to ask legal questions with citations/i)).toBeTruthy();
    });
    expect(sendChatMessage).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RDG disclaimer parity
// ---------------------------------------------------------------------------

describe('RDG disclaimer parity', () => {
  it('always renders the disclaimer in the composer', async () => {
    renderAssistant();
    expect(screen.getByText(/Legal information, not legal advice \(RDG\)/i)).toBeTruthy();
  });
});
