-- Initialize PostgreSQL for OpenWebUI
-- This script runs once when the database is first created

-- Grant all privileges to openwebui user
GRANT ALL PRIVILEGES ON DATABASE openwebui TO openwebui;

-- Set up proper schema permissions
\c openwebui;
GRANT ALL ON SCHEMA public TO openwebui;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO openwebui;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO openwebui;

-- Ensure the user can create tables
ALTER USER openwebui CREATEDB;