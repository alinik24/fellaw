# fellaw

**AI-powered legal assistance platform for navigating German law**

Designed for immigrants, students, and low-income individuals who need accessible legal guidance and support.

---

## Overview

fellaw is an intelligent legal assistance system that combines AI-powered chat, retrieval-augmented generation (RAG) over German legal code, case management, and document analysis to help users understand their legal rights and navigate the German legal system.

### Key Features

- **🤖 AI Legal Chat** — RAG-powered legal Q&A using German law corpus (BGB, StGB, StPO, ZPO, and more)
- **📁 Case Management** — Create, track, and organize legal cases with categories and jurisdictions
- **📅 Evidence Timeline** — Chronological organization of evidence and events
- **✍️ AI Narrative Builder** — Generate police statements, court briefs, and formal complaints
- **🗺️ Legal Roadmap** — Step-by-step action plans with deadlines and priorities
- **🔍 Counterargument Analyzer** — Identify weaknesses in opposing arguments
- **📄 Document Analysis** — Extract and analyze content from PDF, DOCX, and images via Azure Document Intelligence
- **🌐 Bilingual Interface** — Full German and English support
- **👨‍⚖️ Lawyer Referral System** — Connect with verified legal professionals

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Python 3.12 |
| Database | PostgreSQL 16 + pgvector |
| AI Chat | Azure OpenAI gpt-4.1-mini (West Europe) |
| Embeddings / RAG | Azure OpenAI text-embedding-3-large (Sweden Central) |
| Document OCR | Azure Document Intelligence |
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Reverse Proxy | nginx |
| Containerization | Docker + Docker Compose |

### System Diagram

```
                        ┌──────────────────────────────┐
                        │          nginx :80            │
                        │   (reverse proxy entry point) │
                        └────────┬──────────┬───────────┘
                                 │          │
                    /api/*       │          │  /*
                                 ▼          ▼
               ┌─────────────────────┐  ┌──────────────────────┐
               │  FastAPI backend    │  │  React SPA (nginx)   │
               │  :8000              │  │  :80 (inside Docker) │
               └────────┬────────────┘  └──────────────────────┘
                        │
              ┌─────────┴──────────┐
              │  PostgreSQL 16     │
              │  + pgvector :5432  │
              └────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/fellaw.git
cd fellaw
```

### 2. Configure environment

Copy the example environment file and add your Azure AI credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your Azure credentials:
- Azure OpenAI endpoints and API keys
- Azure Document Intelligence endpoint and key
- Change `SECRET_KEY` to a secure random value

**⚠️ Never commit the `.env` file to version control.**

### 3. Start all services

```bash
docker-compose up -d
# or
make up
```

### 4. Run database migrations

```bash
make migrate
# equivalent: docker-compose exec backend alembic upgrade head
```

### 5. Ingest the German law corpus

```bash
make ingest-laws
```

This scrapes **gesetze-im-internet.de** and stores chunked + embedded law sections in PostgreSQL. The first run takes several minutes.

### 6. Access the application

| URL | Service |
|-----|---------|
| http://localhost | Full app (via nginx reverse proxy) |
| http://localhost:3000 | Frontend direct |
| http://localhost:8000/docs | FastAPI Swagger UI |
| http://localhost:8000/redoc | FastAPI ReDoc |

---

## Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Requires a local PostgreSQL instance — update DATABASE_URL in .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Vite dev server: http://localhost:5173
```

---

## Makefile Reference

```bash
make build           # Build all Docker images
make up              # Start services in detached mode
make down            # Stop containers (keep volumes)
make restart         # down + up
make logs            # Follow all service logs

make shell-backend   # bash inside the backend container
make shell-db        # psql inside the postgres container

make migrate         # Run pending Alembic migrations
make makemigrations MSG="description"   # Auto-generate migration
make ingest-laws     # Trigger law ingestion via API

make dev-backend     # Run FastAPI locally (no Docker)
make dev-frontend    # Run Vite dev server locally (no Docker)

make clean           # Remove containers + local images
make clean-volumes   # Remove containers + images + data volumes (!)
```

---

## Environment Variables

All configuration lives in `.env`. Key variables:

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | JWT signing key — change in production |
| `DATABASE_URL` | Full asyncpg connection string |
| `AZURE_WEU_ENDPOINT` / `AZURE_WEU_KEY` | Azure OpenAI West Europe (chat) |
| `AZURE_SE_ENDPOINT` / `AZURE_SE_KEY` | Azure OpenAI Sweden Central (embeddings) |
| `AZURE_CHAT_MODEL` | Deployment name for the chat model |
| `AZURE_EMBEDDING_MODEL` | Deployment name for the embedding model |
| `DOCINTEL_ENDPOINT` / `DOCINTEL_KEY` | Azure Document Intelligence |
| `CORS_ORIGINS` | Allowed frontend origins (JSON array) |
| `MAX_FILE_SIZE` | Maximum upload file size |

---

## Law Database

The RAG pipeline ingests the following German laws from **gesetze-im-internet.de**:

| Code | Name |
|------|------|
| BGB | Bürgerliches Gesetzbuch (Civil Code) |
| StGB | Strafgesetzbuch (Criminal Code) |
| StPO | Strafprozessordnung (Code of Criminal Procedure) |
| ZPO | Zivilprozessordnung (Code of Civil Procedure) |
| VwGO | Verwaltungsgerichtsordnung (Administrative Court Act) |
| AGG | Allgemeines Gleichbehandlungsgesetz (Anti-Discrimination Act) |
| AufenthG | Aufenthaltsgesetz (Residence Act) |
| AsylG | Asylgesetz (Asylum Act) |
| SGB2 | Sozialgesetzbuch II (Social Code II — Basic Income) |
| WoGG | Wohngeldgesetz (Housing Benefit Act) |
| BtMG | Betäubungsmittelgesetz (Narcotics Act) |

---

## Project Structure

```
fellaw/
├── .env                        # Environment variables
├── docker-compose.yml          # Service orchestration
├── Makefile                    # Developer shortcuts
├── README.md
├── DOCUMENTATION.md            # Comprehensive project documentation
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── init.sql                # PostgreSQL init (extensions + grants)
│   ├── alembic/
│   │   ├── env.py              # Async Alembic runner
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial.py  # Full schema migration
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       ├── schemas/
│       ├── api/
│       └── services/
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf              # SPA nginx config (inside container)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│
├── nginx/
│   └── nginx.conf              # Main reverse proxy config
│
├── scripts/
│   └── preload_db.py           # Database seeding script
│
└── uploads/                    # Persisted user uploads (Docker volume)
```

---

## Dual Portal System

fellaw features two integrated portals:

### Citizen Portal
- AI legal chat with RAG
- Case and evidence management
- Document upload and analysis
- Narrative generation tools
- Find and connect with lawyers

### Professional Portal
- Lawyer/law firm registration
- Receive and manage client referrals
- Client case overview
- Integrated practice management

---

## Future Phases & Roadmap

**See [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md) for comprehensive feature analysis, competitor research, and implementation priorities.**

Key upcoming features:
- **Contract Review & Analysis** - AI-powered contract risk assessment
- **Enhanced Legal Research** - Case law search and citation tracking
- **E-Signature Integration** - DocuSign, Yousign integration
- **Urgent Legal Help Workflow** - Fast-track for emergencies
- **Case Outcome Prediction** - ML-based success probability
- **Court Filing Integration** - beA (German e-filing system)

Also see [DOCUMENTATION.md](./DOCUMENTATION.md) for:
- **Phase 2**: Enhanced AI capabilities and multi-jurisdiction support
- **Phase 3**: OpenClaw agent integration for automated legal research
- **Phase 4**: Mobile applications and offline-first architecture
- **Phase 5**: Expansion to other European legal systems

---

## OpenClaw Agent Integration (Planned)

fellaw will integrate with OpenClaw (Claude AI agents) to provide:

- **Automated Legal Research** — Agents that autonomously research case law and precedents
- **Document Drafting** — Intelligent generation of legal documents with context awareness
- **Deadline Management** — Proactive reminders and workflow automation
- **Multi-step Legal Workflows** — Complex task automation (filing, correspondence, etc.)

See [DOCUMENTATION.md](./DOCUMENTATION.md) for implementation details.

---

## Contributing

This project is part of academic research at Fraunhofer Institute. Contributions are welcome for:

- Bug fixes
- Feature enhancements
- Documentation improvements
- Translations
- Test coverage

Please open an issue before starting work on major changes.

---

## License

For academic / research use.

---

## Disclaimer

⚠️ **Legal Notice**: fellaw provides legal information and guidance but **does not constitute legal advice** as defined by § 3 RDG (Rechtsdienstleistungsgesetz). The platform is designed to help users understand their legal situation and connect with qualified legal professionals. For formal legal representation, please consult a licensed attorney.

---

## Contact & Support

For questions, issues, or collaboration:

- **GitHub Issues**: [https://github.com/alinik24/fellaw/issues](https://github.com/alinik24/fellaw/issues)
- **Research Contact**: alinazarikhah1@gmail.com

---

**Built with ❤️ for accessible legal justice**
