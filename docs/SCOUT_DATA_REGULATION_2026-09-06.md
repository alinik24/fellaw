# FelLaw data, regulation, models, and OSS scout — 2026-09-06

Evidence date: 2026-09-06. Search service returned HTTP 429 in this run, so
claims are limited to official URLs, stable project metadata, and direct HTTP
status. Verify terms with counsel before production ingestion or deployment.

## 1. Public legal data for RAG

| Source | URL / access method | Terms / practical note | Confidence |
|---|---|---|---|
| Gesetze im Internet (BMJ/BfJ) | https://www.gesetze-im-internet.de/ ; official HTML/XML corpus pages; RDG page path was not found by this automated check, so use site search/manual review | Official German federal statutes. Preserve source/version/date and verify reuse terms/robots before bulk mirroring | Medium (official domain; exact bulk terms not verified today) |
| Rechtsprechung im Internet | https://www.rechtsprechung-im-internet.de/ ; official decision portal; manual/API availability review required | Court decisions published by the federal justice bodies; anonymisation, copyright, metadata and rate limits must be checked | Medium |
| Open Legal Data | https://openlegaldata.io/ ; project site HTTP 200; API/repository terms must be reviewed per dataset | Useful structured legal-data API/project; do not assume every upstream document has one uniform licence | Medium |
| EUR-Lex | https://eur-lex.europa.eu/eli/reg/2016/679/oj ; direct HTTP 200; EUR-Lex web services/API and bulk access are available subject to official terms | EU legislation and case-law metadata/text; retain CELEX identifiers and language/version metadata | High for official source; access method/quotas need implementation check |
| Bundesanzeiger | https://www.bundesanzeiger.de/ ; official publisher portal; access/licence and paid-content boundaries require review | Do not scrape paid or access-controlled content without permission | Low/medium |

RAG ingestion rule: store source URL, title, jurisdiction, document date,
version/effective date, paragraph/section, retrieval timestamp, and a stable
source identifier. Do not present a retrieved passage as current law without
checking amendments.

## 2. Regulatory constraints (not legal advice)

| Constraint | Official source | Product consequence | Confidence |
|---|---|---|---|
| RDG defines “Rechtsdienstleistung” and restricts unauthorised legal services | https://www.gesetze-im-internet.de/rdg_2008/ ; direct path returned 404 in this automated run; official domain must be manually searched | Keep FelLaw as legal information, structured intake, source-linked explanation, triage and referral unless German counsel approves a different model. Avoid individual binding advice/representation claims | Medium (legal principle; URL needs manual path validation) |
| Legal-Tech-Gesetz / reform around registered debt-collection services changed the framework for some business models | https://www.bmj.de/ ; official BMJ domain; exact page not fetched today | Do not infer that a chatbot or platform is covered by the exceptions. Obtain a written RDG classification for roadmap, document analysis and referral flows | Medium |
| GDPR Art. 9 covers special categories, including health and similar sensitive data | https://eur-lex.europa.eu/eli/reg/2016/679/oj ; HTTP 200, official EUR-Lex | Minimise intake; explicit purpose/access controls; encrypted storage; retention/deletion; no sensitive case details in group Telegram chats; processor/transfer review | High |
| Beratungshilfe and Prozesskostenhilfe are public alternatives for eligible users | https://www.justiz.de/ ; official justice portal; exact pages not fetched today | Include eligibility guidance and links; never present FelLaw payment as the only route to help | Medium |

Required UX guardrails: persistent DE/EN disclaimer; emergency escalation;
source citations; “talk to a lawyer quickly” for eviction, custody, criminal,
deportation and hard deadlines; human review for high-risk outputs; audit
logs for access and referrals.

## 3. Embedding/model candidates

| Model | URL | Dimension / licence note | Confidence |
|---|---|---|---|
| intfloat/multilingual-e5-large | https://huggingface.co/intfloat/multilingual-e5-large | 1024 dimensions; multilingual retrieval incl. German; Hugging Face model card licence/terms must be checked at pin time | Medium |
| BAAI/bge-m3 | https://huggingface.co/BAAI/bge-m3 | 1024 dimensions; multilingual retrieval incl. German; model-card licence must be checked at pin time | Medium |
| jinaai/jina-embeddings-v3 | https://huggingface.co/jinaai/jina-embeddings-v3 | 1024 dimensions in the common configuration; verify model-card terms and task adapters before use | Medium |
| nomic-embed-text | https://huggingface.co/nomic-ai/nomic-embed-text-v1.5 | 768 dimensions; multilingual/German suitability is weaker than the multilingual candidates; verify model-card scope | Medium |

The current application uses 1536-dimensional pgvector columns [repo:
`backend/app/models/law_document.py` / migrations]. These models cannot be
swapped in without a migration or an explicit projection layer. Preferred
pilot: benchmark multilingual-e5-large and bge-m3 on German legal queries,
then choose one and migrate deliberately.

Model/provider policy for FelLaw: KIT Toolbox aliases and approved KIT router;
local Ollama; verified direct NVIDIA Nemotron; verified free OpenRouter routes.
Azure and paid providers are excluded by policy. Configuration is in the repo
root `openclaw.json`; credentials remain environment-only.

## 4. Open-source building blocks

| Project | URL | Licence / use note | Confidence |
|---|---|---|---|
| docassemble | https://github.com/jhpyle/docassemble | Guided legal interviews; AGPL-3.0 — network/service distribution implications require counsel | High for repo/licence observation |
| LibreChat | https://github.com/danny-avila/LibreChat | Chat UI/AI gateway; licence must be reviewed at the pinned commit; do not assume permissive terms | Medium |
| Haystack | https://github.com/deepset-ai/haystack | RAG/orchestration; Apache-2.0 project metadata should be pinned and verified | Medium |
| LangChain | https://github.com/langchain-ai/langchain | General orchestration; licence and dependency tree must be pinned before adoption | Medium |
| pgvector | https://github.com/pgvector/pgvector | PostgreSQL vector extension; PostgreSQL licence; requires compatible DB image/extension | High |
| PaddleOCR | https://github.com/PaddlePaddle/PaddleOCR | OCR; Apache-2.0 project metadata, model-specific terms still require review | Medium |
| Tesseract | https://github.com/tesseract-ocr/tesseract | Apache-2.0; language data and packaging should be checked separately | High |
| faster-whisper | https://github.com/SYSTRAN/faster-whisper | MIT project; underlying model weights have separate terms | Medium |
| aiogram | https://github.com/aiogram/aiogram | Telegram bot framework; MIT project metadata | High |
| grammY | https://github.com/grammyjs/grammY | TypeScript Telegram framework; MIT project metadata | High |

AGPL/GPL blast-radius rule: isolate AGPL components behind a separately
licensed service/adapter; get counsel's view before linking, modifying,
embedding, or offering as a network service. Recheck all transitive and model
weight licences at lockfile/pin time.

## Next experiments

1. Create 30 German legal question/section pairs; compare e5-large/bge-m3
   recall@5 and citation correctness. Pass: >=90% relevant-section recall,
   lawyer-reviewed; owner: RAG service.
2. Run a written RDG review of three outputs (roadmap, document explanation,
   lawyer matching). Pass: approved wording and escalation policy; owner:
   product/legal counsel.
3. Test source update detection against one statute and one EU regulation.
   Pass: amendment/version metadata appears in every answer; owner: ingestion.
