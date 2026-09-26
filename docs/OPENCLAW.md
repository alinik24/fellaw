# OpenClaw integration and recovery

Reviewed against the official OpenClaw documentation on 2026-09-26.

OpenClaw separates an agent workspace from its state directory. The workspace is the agent's working directory and may contain portable `AGENTS.md`, `SOUL.md`, skills, and curated memory; the state directory contains configuration, credentials, session stores, and SQLite state. OpenClaw explicitly advises against committing secrets, raw chat dumps, or anything under the state directory.

For Fellaw, the product repository is canonical for source and product-level agent instructions. The active local profile at `C:\Users\alina\.openclaw-fellaw` remains the canonical runtime because it contains credentials, sessions, device/channel state, and local databases. It is not copied into Git.

## Recovery

1. Clone `https://github.com/alinik24/fellaw.git`.
2. Run `scripts/bootstrap.ps1` and `scripts/doctor.ps1`.
3. Install or update OpenClaw using its official setup instructions.
4. Run `openclaw setup --baseline` for a new profile, then point the Fellaw agent workspace at the cloned repository or a private workspace that references it.
5. Restore credentials and session state separately from an encrypted local backup; never from product Git.
6. Confirm the mapping with `openclaw agents list`, then run `openclaw doctor` before starting the gateway.

## Sources

- [OpenClaw agent workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [OpenClaw agent runtime](https://github.com/openclaw/openclaw/blob/main/docs/concepts/agent.md)
- [OpenClaw memory](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw setup](https://docs.openclaw.ai/start/setup)
- [OpenClaw CLI reference](https://github.com/openclaw/openclaw/blob/main/docs/cli/openclaw.md)
