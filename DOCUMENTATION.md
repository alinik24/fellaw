# fellaw — Comprehensive Documentation

**AI-Powered Legal Assistance Platform for German Law**

Version: 1.0.0  
Last Updated: April 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Capabilities](#core-capabilities)
3. [Technical Architecture](#technical-architecture)
4. [AI & Machine Learning](#ai--machine-learning)
5. [Data Model](#data-model)
6. [API Reference](#api-reference)
7. [Security & Privacy](#security--privacy)
8. [Deployment](#deployment)
9. [Future Phases & Roadmap](#future-phases--roadmap)
10. [OpenClaw Agent Integration](#openclaw-agent-integration)
11. [Contributing](#contributing)

---

## Project Overview

### Mission Statement

fellaw democratizes access to legal information and assistance in Germany by providing an intelligent, AI-powered platform that helps immigrants, students, and low-income individuals understand their legal rights and navigate complex legal processes.

### Problem Statement

**Challenges in German Legal System Access:**

1. **Language Barriers**: Legal documents and procedures are complex, especially for non-native speakers
2. **Cost Prohibitive**: Traditional legal consultation is expensive (€150-300/hour)
3. **Information Asymmetry**: Citizens often don't know their rights or available legal remedies
4. **Process Complexity**: Filing complaints, understanding deadlines, and navigating bureaucracy is difficult
5. **Limited Pro Bono Resources**: Free legal aid has long wait times and limited availability

### Solution Approach

fellaw addresses these challenges through:

- **AI-Powered Legal Chat**: Instant answers to legal questions using RAG over German law corpus
- **Document Intelligence**: Automated analysis of legal documents and evidence
- **Guided Workflows**: Step-by-step assistance through legal processes
- **Lawyer Matching**: Connecting users with verified legal professionals when needed
- **Cost Accessibility**: Free core features with optional paid services

---

## Core Capabilities

### 1. AI Legal Chat with RAG

**Technology Stack:**
- Azure OpenAI GPT-4.1-mini for conversational AI
- text-embedding-3-large (1536 dimensions) for semantic search
- PostgreSQL with pgvector for vector similarity search

**Features:**
- Context-aware legal Q&A in German and English
- Citation of relevant law sections (BGB, StGB, etc.)
- Conversation history and context retention
- Multi-turn dialogue with follow-up questions
- Specialized prompts for different legal domains

**RAG Pipeline:**
1. User query → embedding generation
2. Vector similarity search in law database (top-k retrieval)
3. Context augmentation with retrieved law sections
4. LLM generation with grounded legal knowledge
5. Response with citations and disclaimers

### 2. Case Management System

**Core Features:**
- Create and organize legal cases by category
- Track case status (open, pending, resolved, closed)
- Assign jurisdiction (civil, criminal, administrative)
- Attach documents, evidence, and notes
- Timeline visualization of case events

**Case Categories:**
- Mietrecht (Tenancy Law)
- Arbeitsrecht (Employment Law)
- Ausländerrecht (Immigration Law)
- Strafrecht (Criminal Law)
- Sozialrecht (Social Law)
- Vertragsrecht (Contract Law)
- Diskriminierung (Discrimination)
- Sonstige (Other)

### 3. Evidence Timeline

**Features:**
- Chronological organization of evidence
- Multiple evidence types: documents, photos, videos, witness statements
- Date and time tracking
- Relevance scoring
- Export to PDF for court submissions

### 4. AI Narrative Builder

**Capabilities:**
- **Police Statements**: Generate structured statements for police reports
- **Court Briefs**: Create formal legal arguments and submissions
- **Complaint Letters**: Draft formal complaints to authorities
- **Demand Letters**: Generate legal demand correspondence

**Generation Process:**
1. User provides case context and key facts
2. AI analyzes evidence and legal grounds
3. Structured narrative generation with proper legal formatting
4. User review and editing
5. Export to DOCX or PDF

### 5. Legal Roadmap Generator

**Features:**
- AI-generated step-by-step action plans
- Deadline tracking and reminders
- Priority assignment (urgent, important, routine)
- Task dependencies and sequencing
- Integration with case timeline

**Example Roadmap Steps:**
1. Gather evidence (Week 1)
2. File complaint with landlord (Week 2)
3. Wait for response (2 weeks)
4. Escalate to Mieterschutzbund if needed (Week 5)
5. File court claim if unresolved (Week 8)

### 6. Counterargument Analyzer

**Use Cases:**
- Analyze opposing party's legal arguments
- Identify logical fallacies and weak points
- Suggest counter-evidence and legal precedents
- Predict potential outcomes

**Analysis Dimensions:**
- Legal validity
- Factual accuracy
- Procedural correctness
- Evidentiary support
- Precedent alignment

### 7. Document Analysis (OCR + AI)

**Supported Formats:**
- PDF documents
- Word documents (DOCX)
- Images (JPG, PNG, TIFF)
- Scanned documents

**Azure Document Intelligence Features:**
- Text extraction with layout preservation
- Table and form recognition
- Handwriting recognition
- Multi-language support
- Key-value pair extraction

**AI Analysis:**
- Document classification (contract, notice, court order, etc.)
- Entity extraction (names, dates, amounts, addresses)
- Sentiment analysis
- Legal clause identification
- Risk assessment

### 8. Bilingual Interface

**Supported Languages:**
- German (primary)
- English (full translation)

**Localization Features:**
- UI translation
- Legal term glossary
- Context-aware language switching
- Date and number formatting

### 9. Lawyer Referral System

**Professional Portal Features:**
- Lawyer registration and verification
- Profile creation (specializations, rates, location)
- Referral inbox and management
- Client communication tools
- Case collaboration workspace

**Matching Algorithm:**
- Legal specialization match
- Geographic proximity
- Language compatibility
- Budget constraints
- Availability and response time
- User ratings and reviews

---

## Technical Architecture

### Backend Architecture

**Framework**: FastAPI (Python 3.12)

**Key Components:**

1. **API Layer** (`app/api/`)
   - RESTful endpoints
   - Request validation with Pydantic
   - JWT authentication
   - Rate limiting
   - CORS configuration

2. **Service Layer** (`app/services/`)
   - Business logic separation
   - AI service (chat, embeddings)
   - Narrative service (document generation)
   - Roadmap service (planning)
   - Counterargument service (analysis)
   - Document service (OCR, parsing)
   - RAG service (retrieval-augmented generation)
   - Scraper services (law ingestion)

3. **Data Layer** (`app/models/`, `app/database.py`)
   - SQLAlchemy ORM models
   - Async database operations
   - Connection pooling
   - Migration management (Alembic)

4. **Schema Layer** (`app/schemas/`)
   - Pydantic models for validation
   - Request/response schemas
   - Type safety

### Database Schema

**Core Tables:**

1. **users**
   - User authentication and profile
   - Role-based access (citizen, lawyer, firm, admin)
   - Language preference

2. **cases**
   - Case metadata and status
   - Category and jurisdiction
   - User relationship

3. **evidence**
   - Evidence items linked to cases
   - File storage references
   - Chronological ordering

4. **documents**
   - Uploaded document metadata
   - OCR results and analysis
   - Version tracking

5. **conversations**
   - Chat conversation sessions
   - User context

6. **messages**
   - Individual chat messages
   - Role (user/assistant)
   - Timestamp and ordering

7. **law_documents**
   - German law sections
   - Vector embeddings (1536 dimensions)
   - Metadata (law code, section, title)

8. **forum_posts** (optional)
   - Community Q&A
   - Legal discussions

9. **professionals**
   - Lawyer/firm profiles
   - Specializations and verification

10. **referrals**
    - Client-to-lawyer connections
    - Status tracking

### Frontend Architecture

**Framework**: React 18 + TypeScript

**State Management:**
- React Query (@tanstack/react-query) for server state
- React Context for global UI state
- localStorage for persistence

**Routing:**
- React Router v6
- Protected routes with auth guards
- Role-based routing (citizen vs professional portal)

**UI Components:**
- Radix UI primitives
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React icons

**Key Pages:**
- DualPortalLanding (home)
- Login / Register
- Dashboard
- Cases (list and detail)
- Chat
- Law Library
- Documents
- Find Lawyer / Referrals
- Professional Dashboard / Referrals

### Infrastructure

**Containerization:**
- Docker + Docker Compose
- Multi-stage builds for optimization
- Health checks and restart policies

**Services:**
1. **postgres** (pgvector/pgvector:pg16)
   - PostgreSQL with vector extension
   - Persistent volume

2. **backend** (FastAPI)
   - Uvicorn ASGI server
   - Hot reload in development
   - Volume mounting for code

3. **frontend** (React + nginx)
   - Multi-stage build (npm build → nginx)
   - Static file serving

4. **nginx** (reverse proxy)
   - Route /api/* to backend
   - Route /* to frontend
   - SSL/TLS termination (production)

**Networking:**
- Internal bridge network (fellaw-network)
- Service discovery via service names
- Port mapping for external access

---

## AI & Machine Learning

### Azure OpenAI Integration

**West Europe Instance** (Chat):
- Deployment: gpt-4.1-mini
- Use case: Conversational AI, narrative generation
- API version: 2025-01-01-preview

**Sweden Central Instance** (Embeddings):
- Deployment: text-embedding-3-large
- Dimensions: 1536
- Use case: Semantic search, RAG
- API version: 2025-04-01-preview

### Embedding Strategy

**Text Chunking:**
- Law sections split by § (paragraph)
- Maximum chunk size: 512 tokens
- Overlap: 50 tokens
- Metadata preservation (law code, section number)

**Vector Storage:**
- PostgreSQL pgvector extension
- Index type: HNSW (Hierarchical Navigable Small World)
- Distance metric: Cosine similarity

**Retrieval:**
- Top-k search (k=5 by default)
- Similarity threshold: 0.7
- Re-ranking by relevance and recency

### Prompt Engineering

**System Prompts:**
- Role definition (legal assistant, not lawyer)
- Legal disclaimer emphasis
- Citation requirements
- Tone and language guidelines

**User Prompts:**
- Context injection from RAG
- Conversation history (last N messages)
- User profile and case context

**Generation Parameters:**
- Temperature: 0.3 (factual, consistent)
- Max tokens: 2000
- Top-p: 0.9
- Frequency penalty: 0.3

### Azure Document Intelligence

**Service**: Document Intelligence (formerly Form Recognizer)

**Features Used:**
- Layout API (structure extraction)
- Read API (OCR)
- General document model
- Key-value extraction

**Processing Pipeline:**
1. Upload document to backend
2. Send to Azure Document Intelligence
3. Receive structured JSON response
4. Extract text, tables, key-value pairs
5. Store in database
6. AI analysis of extracted content

---

## Data Model

### User

```python
id: UUID (PK)
email: String (unique)
password_hash: String
full_name: String
role: Enum (citizen, lawyer, firm, admin)
language: Enum (de, en)
created_at: DateTime
```

### Case

```python
id: UUID (PK)
user_id: UUID (FK → users)
title: String
description: Text
category: Enum (mietrecht, arbeitsrecht, ...)
status: Enum (open, pending, resolved, closed)
jurisdiction: Enum (civil, criminal, administrative)
created_at: DateTime
updated_at: DateTime
```

### Evidence

```python
id: UUID (PK)
case_id: UUID (FK → cases)
title: String
description: Text
evidence_type: Enum (document, photo, video, witness)
file_path: String (optional)
event_date: DateTime
created_at: DateTime
```

### LawDocument

```python
id: UUID (PK)
law_code: String (e.g., "BGB", "StGB")
section: String (e.g., "§ 812")
title: String
content: Text
embedding: Vector(1536)
url: String
created_at: DateTime
```

### Conversation

```python
id: UUID (PK)
user_id: UUID (FK → users)
title: String
created_at: DateTime
updated_at: DateTime
```

### Message

```python
id: UUID (PK)
conversation_id: UUID (FK → conversations)
role: Enum (user, assistant)
content: Text
created_at: DateTime
```

### Professional

```python
id: UUID (PK)
user_id: UUID (FK → users)
firm_name: String (optional)
license_number: String
specializations: JSON (array)
hourly_rate: Decimal
city: String
verified: Boolean
bio: Text
created_at: DateTime
```

### Referral

```python
id: UUID (PK)
case_id: UUID (FK → cases)
professional_id: UUID (FK → professionals)
status: Enum (pending, accepted, declined, completed)
message: Text
created_at: DateTime
```

---

## API Reference

### Authentication

**POST** `/api/v1/auth/register`
- Register new user
- Request: `{ email, password, full_name, role? }`
- Response: `{ access_token, user }`

**POST** `/api/v1/auth/login`
- User login
- Request: `{ email, password }`
- Response: `{ access_token, user }`

**POST** `/api/v1/auth/guest`
- Guest login (demo)
- Response: `{ access_token, user }`

**GET** `/api/v1/auth/me`
- Get current user
- Auth: Bearer token required
- Response: `{ user }`

### Cases

**GET** `/api/v1/cases`
- List user's cases
- Auth: Required
- Response: `{ cases: [...] }`

**POST** `/api/v1/cases`
- Create new case
- Request: `{ title, description, category, jurisdiction }`
- Response: `{ case }`

**GET** `/api/v1/cases/{id}`
- Get case details
- Response: `{ case, evidence: [...] }`

**PUT** `/api/v1/cases/{id}`
- Update case
- Request: `{ title?, description?, status? }`
- Response: `{ case }`

**DELETE** `/api/v1/cases/{id}`
- Delete case
- Response: `{ message }`

### Evidence

**POST** `/api/v1/cases/{case_id}/evidence`
- Add evidence to case
- Request: `{ title, description, evidence_type, event_date, file? }`
- Response: `{ evidence }`

**GET** `/api/v1/evidence/{id}`
- Get evidence details
- Response: `{ evidence }`

**DELETE** `/api/v1/evidence/{id}`
- Delete evidence
- Response: `{ message }`

### Chat

**GET** `/api/v1/chat/conversations`
- List conversations
- Auth: Required
- Response: `{ conversations: [...] }`

**POST** `/api/v1/chat/conversations`
- Create conversation
- Request: `{ title? }`
- Response: `{ conversation }`

**POST** `/api/v1/chat/conversations/{id}/messages`
- Send message (streaming response)
- Request: `{ content, case_id? }`
- Response: Server-Sent Events (streaming)

**GET** `/api/v1/chat/conversations/{id}/messages`
- Get conversation history
- Response: `{ messages: [...] }`

### Documents

**POST** `/api/v1/documents/upload`
- Upload document for analysis
- Request: multipart/form-data `{ file, case_id? }`
- Response: `{ document, analysis }`

**GET** `/api/v1/documents`
- List user's documents
- Response: `{ documents: [...] }`

**GET** `/api/v1/documents/{id}`
- Get document details
- Response: `{ document }`

### Laws

**POST** `/api/v1/laws/ingest`
- Trigger law ingestion (admin)
- Request: `{ laws: ["BGB", "StGB", ...] }`
- Response: `{ message, count }`

**GET** `/api/v1/laws/search`
- Search law database
- Query params: `?q=<query>&limit=10`
- Response: `{ results: [...] }`

### Professionals

**POST** `/api/v1/professionals/register`
- Register as legal professional
- Request: `{ firm_name?, license_number, specializations, hourly_rate, city, bio }`
- Response: `{ professional }`

**GET** `/api/v1/professionals`
- List professionals
- Query params: `?specialization=mietrecht&city=Berlin`
- Response: `{ professionals: [...] }`

**GET** `/api/v1/professionals/{id}`
- Get professional details
- Response: `{ professional, reviews: [...] }`

### Referrals

**POST** `/api/v1/referrals`
- Create referral request
- Request: `{ case_id, professional_id, message }`
- Response: `{ referral }`

**GET** `/api/v1/referrals`
- List user's referrals
- Response: `{ referrals: [...] }`

**PUT** `/api/v1/referrals/{id}`
- Update referral status
- Request: `{ status }`
- Response: `{ referral }`

---

## Security & Privacy

### Authentication & Authorization

**JWT Tokens:**
- HS256 algorithm
- 7-day expiration
- Refresh token rotation (planned)

**Password Security:**
- Bcrypt hashing
- Minimum length: 8 characters
- Complexity requirements (planned)

**Role-Based Access Control:**
- citizen: basic features
- lawyer/firm: professional portal
- admin: system management

### Data Privacy

**GDPR Compliance:**
- Right to access (export user data)
- Right to deletion (account deletion)
- Data minimization (collect only necessary data)
- Consent management (T&C acceptance)

**Data Encryption:**
- TLS/SSL for data in transit
- Database encryption at rest (PostgreSQL)
- Secure file storage

**Sensitive Data Handling:**
- Legal documents treated as confidential
- Access logs for audit trail
- No sharing with third parties without consent

### Security Best Practices

1. **Input Validation**: Pydantic schemas for all API inputs
2. **SQL Injection Prevention**: SQLAlchemy ORM (parameterized queries)
3. **XSS Prevention**: React's built-in escaping
4. **CSRF Protection**: SameSite cookies (planned)
5. **Rate Limiting**: Per-endpoint request throttling
6. **CORS**: Whitelist of allowed origins
7. **File Upload Validation**: Type checking, size limits, virus scanning (planned)

---

## Deployment

### Development

```bash
docker-compose up -d
make migrate
make ingest-laws
```

### Production Considerations

**Environment:**
- Use production-grade WSGI server (Gunicorn + Uvicorn workers)
- Set `DEBUG=False`
- Change `SECRET_KEY` to strong random value
- Use environment-specific `.env` files

**Database:**
- Managed PostgreSQL service (AWS RDS, Azure Database, etc.)
- Automated backups
- Read replicas for scalability
- Connection pooling

**File Storage:**
- Object storage (AWS S3, Azure Blob Storage)
- CDN for static assets
- Separate upload bucket

**Monitoring:**
- Application logs (structured logging)
- Error tracking (Sentry)
- Performance monitoring (APM)
- Uptime monitoring

**Scaling:**
- Horizontal scaling of backend (multiple containers)
- Load balancer (nginx or cloud load balancer)
- Database connection pooling
- Redis for caching and session storage

**CI/CD:**
- GitHub Actions for automated testing
- Docker image building and pushing
- Automated deployment to staging/production
- Database migration automation

**SSL/TLS:**
- Let's Encrypt certificates
- Automatic renewal
- HTTPS enforcement

---

## Future Phases & Roadmap

### Phase 1: Core Platform (✅ Completed)

**Q1-Q2 2026**

- ✅ AI legal chat with RAG
- ✅ Case and evidence management
- ✅ Document upload and analysis
- ✅ Narrative generation tools
- ✅ Dual portal (citizen + professional)
- ✅ Basic lawyer referral system

### Phase 2: Enhanced AI Capabilities (Q3-Q4 2026)

**Goals:**
- Advanced AI reasoning with multi-step planning
- Predictive analytics (case outcome prediction)
- Multi-jurisdiction support (Austria, Switzerland)
- Voice interface (speech-to-text, text-to-speech)
- Mobile-responsive design improvements

**Features:**
- **Outcome Prediction**: ML model to predict case success probability
- **Similar Case Finder**: Vector search over historical case database
- **Automated Deadline Calculator**: Parse legal deadlines from documents
- **Voice Chat**: Speak questions instead of typing
- **Multi-language Support**: Add Turkish, Arabic, Polish (top immigrant languages)

**Technical:**
- Fine-tuned models on German legal corpus
- Graph database for case relationships (Neo4j)
- Real-time collaboration features (WebSockets)
- Enhanced caching with Redis

### Phase 3: OpenClaw Agent Integration (Q1-Q2 2027)

**Vision**: Autonomous AI agents that handle complex legal workflows end-to-end.

See [OpenClaw Agent Integration](#openclaw-agent-integration) section below for details.

### Phase 4: Mobile Applications (Q3-Q4 2027)

**Platforms:**
- iOS (Swift + SwiftUI)
- Android (Kotlin + Jetpack Compose)
- React Native (cross-platform alternative)

**Features:**
- Native mobile UI
- Offline-first architecture
- Push notifications for deadlines
- Mobile document scanning
- Biometric authentication

**Technical:**
- GraphQL API for efficient mobile data fetching
- Local SQLite database for offline mode
- Background sync

### Phase 5: European Expansion (2028+)

**Target Markets:**
- Austria (ABGB, StGB-AT)
- Switzerland (ZGB, OR)
- France (Code civil)
- Netherlands (BW)

**Challenges:**
- Multi-jurisdictional law databases
- Language support for each country
- Local legal professional networks
- Regulatory compliance per country

**Features:**
- Cross-border legal issue handling
- EU law integration (GDPR, consumer rights)
- Automated jurisdiction detection

### Phase 6: Community & Gamification (2028+)

**Goals:**
- Build a community of legal knowledge sharing
- Incentivize user contributions
- Peer-to-peer support

**Features:**
- **Community Forum**: Q&A platform (similar to Stack Overflow)
- **Legal Wiki**: Collaborative legal knowledge base
- **Points & Badges**: Gamification for helpful contributions
- **Pro Bono Marketplace**: Connect volunteers with those in need
- **Success Stories**: Share positive case outcomes

---

## OpenClaw Agent Integration

### Overview

**OpenClaw** is an agentic AI framework built on Claude (Anthropic) that enables autonomous, multi-step task execution. Integration with fellaw will enable AI agents to:

1. **Autonomously research** relevant case law and precedents
2. **Draft complex legal documents** with minimal user input
3. **Monitor deadlines** and proactively remind users
4. **Execute multi-step workflows** (filing, correspondence, follow-ups)
5. **Learn from outcomes** and improve suggestions over time

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     fellaw Frontend                     │
│  (React UI for case management, chat, documents)        │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ REST/GraphQL API
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  fellaw Backend (FastAPI)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         OpenClaw Agent Orchestrator              │   │
│  │  - Agent lifecycle management                    │   │
│  │  - Task queue (Celery + Redis)                   │   │
│  │  - Agent state persistence                       │   │
│  │  - Result aggregation                            │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Agent API Calls
                 ▼
┌─────────────────────────────────────────────────────────┐
│               OpenClaw Agent Runtime                    │
│  (Claude-powered autonomous agents)                     │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Research  │  │   Draft    │  │  Workflow  │       │
│  │   Agent    │  │   Agent    │  │   Agent    │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                         │
│  Tools: Web search, document read/write, email,        │
│         calendar, database query, API calls            │
└─────────────────────────────────────────────────────────┘
                 │
                 │ External Services
                 ▼
┌─────────────────────────────────────────────────────────┐
│  • German case law databases (juris, beck-online)       │
│  • Court filing systems (e.g., beA)                     │
│  • Email (Gmail, Outlook)                               │
│  • Calendar (Google Calendar, Outlook)                  │
│  • Document storage (S3, Azure Blob)                    │
└─────────────────────────────────────────────────────────┘
```

### Agent Types

#### 1. Research Agent

**Purpose**: Autonomous legal research on case law, statutes, and precedents.

**Capabilities:**
- Search German case law databases (juris, beck-online)
- Retrieve relevant court decisions
- Summarize findings and extract key points
- Identify supporting and opposing precedents
- Generate research memos

**Workflow:**
1. Receive research query from user
2. Decompose into sub-queries
3. Search multiple databases in parallel
4. Retrieve and parse results
5. Rank by relevance
6. Synthesize findings
7. Generate structured research report

**Tools:**
- WebSearch (Perplexity, Bing)
- DocumentRead (PDF parsing)
- DatabaseQuery (law database API)
- Summarize (Claude long-context)

#### 2. Document Drafting Agent

**Purpose**: Generate complex legal documents with proper formatting and legal language.

**Capabilities:**
- Draft contracts, complaints, motions, briefs
- Fill in templates with case-specific data
- Ensure legal compliance and proper citations
- Multi-draft revision with user feedback
- Export to DOCX with formatting

**Workflow:**
1. Receive document type and parameters
2. Retrieve relevant templates
3. Gather case facts and evidence from database
4. Generate first draft
5. Internal review and citation checking
6. Present to user for feedback
7. Iterate until approved
8. Final formatting and export

**Tools:**
- DocumentWrite (template filling)
- CaseLawQuery (citation verification)
- FormatConverter (DOCX export)

#### 3. Deadline & Workflow Agent

**Purpose**: Proactive deadline management and multi-step workflow automation.

**Capabilities:**
- Parse legal documents for deadlines
- Calculate filing deadlines based on procedural rules
- Set reminders and calendar events
- Execute scheduled tasks (send reminder emails)
- Escalate urgent items

**Workflow:**
1. Monitor case documents for deadline mentions
2. Parse and extract dates
3. Calculate procedural deadlines (e.g., StPO § 37: 2 weeks to file Widerspruch)
4. Add to calendar with appropriate lead time
5. Send reminders to user
6. If deadline missed, calculate next steps

**Tools:**
- CalendarWrite (Google Calendar API)
- EmailSend (SMTP)
- ReminderSchedule (Celery tasks)
- LegalDeadlineCalculator (custom rules engine)

#### 4. Filing & Correspondence Agent

**Purpose**: Automate filing of documents with courts and communication with authorities.

**Capabilities:**
- Submit documents via beA (electronic lawyer mailbox)
- Send formal letters to authorities
- Track correspondence status
- Parse responses and extract key information
- Notify user of updates

**Workflow:**
1. User approves document for filing
2. Agent validates document completeness
3. Connects to beA or court portal
4. Uploads document with metadata
5. Receives confirmation
6. Monitors for response
7. Notifies user when response received

**Tools:**
- beAConnector (German e-filing system)
- EmailSend (formal correspondence)
- DocumentUpload (court portals)
- StatusMonitor (polling for updates)

### Implementation Plan

#### Step 1: Infrastructure Setup (Month 1-2)

**Tasks:**
1. Set up Celery + Redis for async task queue
2. Create agent orchestrator service in backend
3. Implement agent state persistence (PostgreSQL)
4. Set up monitoring and logging

**Tech Stack:**
- Celery for distributed task queue
- Redis for message broker
- PostgreSQL for agent state
- Structlog for logging

#### Step 2: Agent Runtime Integration (Month 3-4)

**Tasks:**
1. Integrate Claude API with agent framework
2. Implement tool registry (web search, document ops, etc.)
3. Create agent prompts and personas
4. Build feedback loop for agent improvement

**Claude Agent SDK:**
```python
from claude_agent_sdk import Agent, Tool, Workflow

research_agent = Agent(
    name="Legal Research Agent",
    model="claude-opus-4-6",
    tools=[WebSearchTool(), DatabaseQueryTool(), SummarizeTool()],
    system_prompt=RESEARCH_AGENT_PROMPT,
)

result = await research_agent.run(
    task="Find German case law on unlawful termination for pregnant employees",
    context={"case_id": "uuid-1234", "jurisdiction": "arbeitsrecht"},
)
```

#### Step 3: Tool Development (Month 5-6)

**Priority Tools:**
1. **WebSearchTool**: Search legal databases
2. **DocumentReadTool**: Parse PDFs, DOCX
3. **DocumentWriteTool**: Generate documents
4. **DatabaseQueryTool**: Query law_documents table
5. **CalendarTool**: Google Calendar integration
6. **EmailTool**: Send emails via SMTP

#### Step 4: Agent Deployment & Testing (Month 7-8)

**Tasks:**
1. Deploy research agent (MVP)
2. User testing with beta users
3. Collect feedback and iterate
4. Deploy additional agents incrementally

#### Step 5: Production Rollout (Month 9-10)

**Tasks:**
1. Scale infrastructure for production load
2. Implement rate limiting and cost controls
3. Add agent usage analytics
4. Launch to all users with feature flags

### Use Case Examples

#### Example 1: Tenant Rights Research

**User Query**: "My landlord wants to evict me because I complained about mold. Can they do that?"

**Agent Workflow:**
1. Research Agent activates
2. Searches for "Mietrecht Kündigung Mängel Schimmel" in law database
3. Retrieves relevant BGB sections (§ 536, § 543, § 569)
4. Searches case law database for similar cases
5. Finds BGH decision (BGH VIII ZR 185/14) on unlawful termination
6. Synthesizes findings:
   - Tenant has right to withhold rent for defects (§ 536 BGB)
   - Landlord cannot terminate for good-faith complaints
   - Case law supports tenant's position
7. Generates summary report with citations
8. Suggests next steps (document mold, send formal complaint)

#### Example 2: Discrimination Complaint Drafting

**User Request**: "Draft a complaint to my employer for pregnancy discrimination"

**Agent Workflow:**
1. Document Drafting Agent activates
2. Gathers case facts from user's case file
3. Retrieves AGG (Anti-Discrimination Act) provisions
4. Loads complaint template
5. Generates first draft with:
   - Formal header (employer address, date)
   - Statement of facts (pregnancy disclosure, adverse action)
   - Legal grounds (AGG § 3, § 7, § 15)
   - Demand (reinstatement, compensation)
   - Deadline for response (2 weeks)
6. Presents draft to user for review
7. User edits and approves
8. Agent exports to DOCX and PDF

#### Example 3: Deadline Monitoring

**Scenario**: User receives court summons with filing deadline

**Agent Workflow:**
1. User uploads court summons (PDF)
2. Document Analysis extracts: "Antwort bis 15.05.2027"
3. Deadline Agent calculates:
   - Filing deadline: May 15, 2027
   - Reminder 1: May 1, 2027 (2 weeks before)
   - Reminder 2: May 8, 2027 (1 week before)
   - Reminder 3: May 13, 2027 (2 days before)
4. Adds events to user's calendar
5. Schedules email reminders
6. On May 1, sends: "Your response to [case] is due in 2 weeks"
7. If not filed by May 13, sends urgent notification

### Security & Privacy Considerations

**Data Access:**
- Agents only access data for authorized users
- Case files encrypted at rest
- Agent actions logged for audit trail

**Cost Control:**
- Per-user monthly agent usage limits
- Rate limiting on expensive operations (web search)
- Usage analytics and alerts

**Human-in-the-Loop:**
- Critical actions (filing, sending emails) require user approval
- User can pause or cancel agent tasks
- Agent explanations for all actions taken

**Compliance:**
- Agent actions comply with GDPR (data processing agreements)
- No agent access to data after user deletion
- Transparent agent capabilities communicated to users

### Future Enhancements

**Reinforcement Learning:**
- Learn from successful vs. unsuccessful agent workflows
- Optimize research strategies based on case outcomes
- Personalize agent behavior per user preferences

**Multi-Agent Collaboration:**
- Research Agent → Drafting Agent pipeline
- Parallel agent execution for complex tasks
- Agent-to-agent communication protocol

**Advanced Reasoning:**
- Chain-of-thought prompting for complex legal analysis
- Tree-of-thought for exploring multiple legal strategies
- Self-critique and revision loops

---

## Contributing

We welcome contributions from the community!

### How to Contribute

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Open an issue with use case and rationale
3. **Submit PRs**: Fork, create feature branch, submit PR with tests
4. **Improve Docs**: Fix typos, add examples, clarify explanations

### Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/fellaw.git
cd fellaw
docker-compose up -d
make migrate
make ingest-laws
```

### Code Style

**Backend (Python):**
- PEP 8 compliance
- Type hints for all functions
- Docstrings for public APIs
- pytest for testing

**Frontend (TypeScript):**
- ESLint + Prettier
- Strict TypeScript mode
- React best practices
- Vitest for testing

### Pull Request Process

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with tests
3. Run linter: `make lint`
4. Run tests: `make test`
5. Commit with clear message
6. Push and create PR
7. Address review feedback
8. Merge after approval

---

## License

For academic / research use — Fraunhofer research project.

For commercial use, please contact: research@example.de

---

## Acknowledgments

- **Fraunhofer Institute**: Research support and infrastructure
- **Azure AI**: OpenAI and Document Intelligence services
- **Open-source community**: FastAPI, React, PostgreSQL, and countless libraries
- **Legal experts**: Domain knowledge and validation
- **Beta testers**: Feedback and feature suggestions

---

## Contact

**Project Lead**: [Your Name]  
**Email**: research@example.de  
**GitHub**: https://github.com/YOUR_USERNAME/fellaw  
**Issues**: https://github.com/YOUR_USERNAME/fellaw/issues

---

**Last Updated**: April 3, 2026  
**Version**: 1.0.0
