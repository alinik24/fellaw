# =============================================================================
# fellaw — Makefile
# =============================================================================
# Usage:  make <target>
# Requires: docker, docker-compose, python3, npm
# =============================================================================

COMPOSE        := docker-compose
BACKEND_SVC    := backend
DB_SVC         := postgres
FRONTEND_SVC   := frontend
DB_USER        := fellaw
DB_NAME        := fellaw_db

.PHONY: help build up down restart logs \
        shell-backend shell-db \
        migrate makemigrations ingest-laws \
        dev-backend dev-frontend \
        clean clean-volumes lint test

# ── Default target ────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  fellaw — available make targets"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo "  build           Build all Docker images"
	@echo "  up              Start all services in detached mode"
	@echo "  down            Stop and remove containers (keep volumes)"
	@echo "  restart         down + up"
	@echo "  logs            Follow logs for all services"
	@echo ""
	@echo "  shell-backend   Open a bash shell inside the backend container"
	@echo "  shell-db        Open a psql shell inside the postgres container"
	@echo ""
	@echo "  migrate         Run pending Alembic migrations inside the backend"
	@echo "  makemigrations  Auto-generate a new Alembic revision (MSG= required)"
	@echo "                  Example: make makemigrations MSG='add user avatar'"
	@echo "  ingest-laws     Trigger the law-ingestion endpoint (loads German law)"
	@echo ""
	@echo "  dev-backend     Run the FastAPI backend locally (not in Docker)"
	@echo "  dev-frontend    Run the Vite dev server locally (not in Docker)"
	@echo ""
	@echo "  clean           Remove containers + images (keeps volumes)"
	@echo "  clean-volumes   Remove containers + images + all named volumes (!)"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo ""

# ── Docker lifecycle ──────────────────────────────────────────────────────────
build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d
	@echo "Services started. Visit http://localhost"

down:
	$(COMPOSE) down

restart: down up

logs:
	$(COMPOSE) logs -f

# ── Container shells ──────────────────────────────────────────────────────────
shell-backend:
	$(COMPOSE) exec $(BACKEND_SVC) bash

shell-db:
	$(COMPOSE) exec $(DB_SVC) psql -U $(DB_USER) -d $(DB_NAME)

# ── Database migrations ───────────────────────────────────────────────────────
migrate:
	$(COMPOSE) exec $(BACKEND_SVC) alembic upgrade head

# Usage: make makemigrations MSG="describe your change"
makemigrations:
	@if [ -z "$(MSG)" ]; then \
		echo "ERROR: MSG is required. Usage: make makemigrations MSG='your message'"; \
		exit 1; \
	fi
	$(COMPOSE) exec $(BACKEND_SVC) alembic revision --autogenerate -m "$(MSG)"

# ── Law ingestion ─────────────────────────────────────────────────────────────
ingest-laws:
	@echo "Triggering law ingestion (this may take several minutes)..."
	curl -s -X POST http://localhost:8000/api/v1/laws/ingest \
		-H "Content-Type: application/json" \
		-d '{"laws": ["BGB","StGB","StPO","ZPO","VwGO","AGG","AufenthG","AsylG","SGB2","WoGG","BtMG"]}' \
		| python3 -m json.tool

# ── Local development (without Docker) ───────────────────────────────────────
dev-backend:
	@echo "Starting FastAPI backend on http://localhost:8000 ..."
	cd backend && \
		pip install -q -r requirements.txt && \
		uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Starting Vite dev server on http://localhost:5173 ..."
	cd frontend && \
		npm install && \
		npm run dev

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	$(COMPOSE) down --rmi local --remove-orphans

clean-volumes:
	@echo "WARNING: This will delete the postgres data volume!"
	$(COMPOSE) down -v --rmi local --remove-orphans

# ── Code quality (run inside backend venv or container) ───────────────────────
lint:
	$(COMPOSE) exec $(BACKEND_SVC) python -m flake8 app/ --max-line-length=120
	$(COMPOSE) exec $(BACKEND_SVC) python -m mypy app/ --ignore-missing-imports

test:
	$(COMPOSE) exec $(BACKEND_SVC) python -m pytest tests/ -v
