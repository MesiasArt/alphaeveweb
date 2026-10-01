CREATE TABLE IF NOT EXISTS cms_content (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('comics', 'authors', 'projects')),
  slug TEXT NOT NULL,
  payload TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_type, slug)
);

CREATE TABLE IF NOT EXISTS cms_media (
  object_key TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cms_content_updated_at ON cms_content(updated_at);
