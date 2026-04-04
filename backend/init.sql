-- =============================================================================
-- init.sql — run automatically by PostgreSQL on first container startup
-- (mounted at /docker-entrypoint-initdb.d/init.sql)
-- =============================================================================

-- pgvector: enables vector similarity search used by the RAG pipeline
CREATE EXTENSION IF NOT EXISTS vector;

-- uuid-ossp: provides uuid_generate_v4() used as default PK values
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm: trigram-based full-text / fuzzy search on law text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Make sure the application user has full access to the database
-- (the user is already the owner because POSTGRES_USER created the DB,
--  but these grants are kept explicit for clarity in CI / test environments)
GRANT ALL PRIVILEGES ON DATABASE fellaw_db TO fellaw;
GRANT ALL ON SCHEMA public TO fellaw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO fellaw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fellaw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO fellaw;
