# Agent development guide

## Product boundary

Fellaw is a legal first-response and case-navigation product. It gives structured information and next-step support; it does not claim to replace a lawyer or provide individualized legal representation. Preserve the explicit legal-boundary checks in `backend/app/services/legal_boundary.py`.

## Repository map

- `backend/app`: FastAPI API, SQLAlchemy models, service layer, and safety logic.
- `backend/alembic`: ordered database migrations.
- `backend/tests`: unit, contract, and opt-in live integration tests.
- `frontend/src`: React application and API clients.
- `backend/scripts/loop`: reproducible evaluation loop; generated `metrics/` output is ignored.
- `docs`: product contract, research, architecture, evidence, and roadmap.

## Safe change workflow

1. Read `docs/PRODUCT_CONTRACT.md`, `docs/ARCHITECTURE.md`, and the closest tests.
2. Keep API behavior in backend services; clients and bot adapters must call the same contracts.
3. Never fabricate case status, lawyer availability, deadlines, or successful mutations.
4. Add or update tests for legal-boundary, authentication, and ownership behavior.
5. Run `scripts/doctor.ps1`, backend tests, and the frontend test/build gates.

## Data and secrets

Never commit `.env`, tokens, credentials, user documents, transcripts, runtime databases, or OpenClaw sessions. Use `.env.example`. Synthetic fixtures must be clearly synthetic.

## Starting from no local checkout

Confirm private `alinik24/fellaw` and its current default, clone it, and record branch/HEAD. Run the repository bootstrap and doctor commands, read only task-relevant architecture/development docs, and run the documented baseline tests. Implement, rerun affected gates, commit and push, verify the remote commit, and leave clean remote-backed state. The OpenClaw profile is private runtime state, not a source backup; no sibling checkout or personal absolute path may be required.

## Database changes

Add a forward Alembic migration; do not rewrite an applied migration. Check that revision links form one head. Keep ORM and API schemas aligned.

## Commands

```powershell
.\scripts\bootstrap.ps1
.\scripts\doctor.ps1
```

Live/provider tests are opt-in and must not be required for the default offline gate.

## Dependency maintenance

Audit the frontend with `npm audit` and the backend requirements with `pip-audit -r backend/requirements.txt`; classify runtime versus development exposure and direct versus transitive dependencies before changing versions. Never use force-fix or bulk major upgrades blindly. After dependency changes, run bootstrap, doctor, all backend tests, each frontend contract test file separately on Windows, and the production frontend build. Preserve the OpenClaw boundary and never inspect or copy its runtime state while auditing portable source.
