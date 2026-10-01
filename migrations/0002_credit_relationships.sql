-- The content catalog is partly bundled in seo-data.js and partly overridden
-- in cms_content. These small identity tables let relational credits reference
-- either source without copying or replacing the existing content payloads.
CREATE TABLE IF NOT EXISTS cms_comics (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_creators (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_chapters (
  comic_slug TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_number INTEGER,
  title TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (comic_slug, chapter_id),
  FOREIGN KEY (comic_slug) REFERENCES cms_comics(slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cms_credits (
  credit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  comic_slug TEXT NOT NULL,
  chapter_id TEXT,
  creator_slug TEXT,
  external_name TEXT,
  role TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  CHECK (
    (creator_slug IS NOT NULL AND external_name IS NULL) OR
    (creator_slug IS NULL AND length(trim(external_name)) > 0)
  ),
  CHECK (chapter_id IS NULL OR length(trim(chapter_id)) > 0),
  CHECK (chapter_id IS NULL OR length(trim(role)) > 0),
  FOREIGN KEY (comic_slug) REFERENCES cms_comics(slug) ON DELETE CASCADE,
  FOREIGN KEY (creator_slug) REFERENCES cms_creators(slug),
  FOREIGN KEY (comic_slug, chapter_id) REFERENCES cms_chapters(comic_slug, chapter_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS cms_credits_comic_creator_role
  ON cms_credits(comic_slug, creator_slug, role)
  WHERE chapter_id IS NULL AND creator_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cms_credits_comic_external_role
  ON cms_credits(comic_slug, external_name, role)
  WHERE chapter_id IS NULL AND external_name IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cms_credits_chapter_creator_role
  ON cms_credits(comic_slug, chapter_id, creator_slug, role)
  WHERE chapter_id IS NOT NULL AND creator_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cms_credits_chapter_external_role
  ON cms_credits(comic_slug, chapter_id, external_name, role)
  WHERE chapter_id IS NOT NULL AND external_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS cms_credits_creator ON cms_credits(creator_slug, comic_slug);
CREATE INDEX IF NOT EXISTS cms_credits_chapter ON cms_credits(comic_slug, chapter_id, position);

CREATE TABLE IF NOT EXISTS cms_migration_state (
  state_key TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
