-- Kanban projection. Source of truth = tickets/*.md files.
-- This table is a read cache, rebuilt by the file watcher on every .md change.

CREATE TABLE IF NOT EXISTS tickets (
  id          TEXT PRIMARY KEY,        -- "0001"
  type        TEXT NOT NULL,           -- feat | fix | task | chore | docs
  slug        TEXT NOT NULL,           -- "login-page"
  title       TEXT NOT NULL,           -- derived from slug or first H1
  status      TEXT NOT NULL,           -- open | in-progress | review | qa | done
  parent      TEXT,                    -- parent ticket id, nullable
  labels      TEXT DEFAULT '[]',       -- JSON array string
  github_url  TEXT,                    -- filled after migrate-to-github
  filename    TEXT NOT NULL,           -- "0001-feat-login-page.md"
  body        TEXT DEFAULT '',         -- markdown body (without frontmatter)
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_type   ON tickets(type);
