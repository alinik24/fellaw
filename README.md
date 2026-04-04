# FelLaw - Legal Aid Platform

A comprehensive legal aid platform connecting clients with legal professionals.

## Project Structure

```
fellaw/
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   ├── alembic/      # Database migrations
│   └── uploads/      # File uploads
├── frontend/          # React + TypeScript frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── dist/         # Build output
└── .claude/          # Claude Code configuration
```

## Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- Urgent legal help workflow
- Case-specific intake forms
- Lawyer matching
- Document management

## Tech Stack
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Database**: PostgreSQL
