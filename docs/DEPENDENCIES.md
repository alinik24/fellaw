# Dependency maintenance

## Policy

- Backend: pip with exact top-level pins in `backend/requirements.txt`; Python 3.11 is the verified runtime.
- Frontend: npm with `frontend/package-lock.json`; Node 20.19+ or 22.12+ is required by Vite 7 and Node 22 is the verified runtime.
- Run `pip-audit -r backend/requirements.txt` and `npm --prefix frontend audit` before changing versions.
- Prefer a fixed release in the existing major. For a required major, read official migration notes and prove compatibility with the full affected gates.
- Never use `npm audit fix --force`. Do not mix npm with pnpm/yarn or introduce an additional Python package manager.
- Optional provider and heavy document-processing packages stay explicitly documented and must not pull private provider credentials or OpenClaw runtime into tests.

Run `scripts/bootstrap.ps1`, `scripts/doctor.ps1`, all backend tests, the three frontend contract files separately on Windows, and the production build after dependency changes.

## 2026-09-26 decisions

The frontend baseline had seven findings (five moderate, one high, one critical). They grouped under direct runtime `react-router-dom` and direct development dependencies Vite/Vitest. React Router moved from 6.30.6 to 7.18.4; the application uses declarative routing only, and all route contracts pass. Vite moved from 5.4.21 to 7.3.6 and Vitest from 2.1.9 to 4.1.11 after reviewing their migration guides. The removed Vitest `--minWorkers` option was deleted from the test script. The final npm audit is clean.

The Python baseline reported 153 advisory records across nine packages. Direct runtime pins were updated for FastAPI, python-multipart, python-dotenv, python-jose, Pillow, pypdf, lxml, and Jinja2. This resolved 139 records while preserving all 82 backend tests.

Fourteen records remain:

- Twelve duplicate/variant records affect transitive Starlette 0.48.0. FastAPI 0.116.2 is the newest tested line that preserves Fellaw's route-registration and legal-boundary contracts. The newest FastAPI/Starlette pair was tested and rejected after four contract failures; forcing Starlette beyond FastAPI's supported range is deferred.
- Two duplicate records describe the same unfixed `ecdsa` advisory. It is transitive through python-jose, has no fixed release, and Fellaw's configured JWT algorithm is HS256, so the affected elliptic-curve path is not used.

Major upgrades unrelated to an advisory—including React 19, Tailwind 4, Recharts 3, TypeScript 7, and the rest of the UI library backlog—were not required and remain deferred.
