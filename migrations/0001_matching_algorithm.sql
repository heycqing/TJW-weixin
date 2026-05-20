ALTER TABLE users ADD COLUMN activeHour INTEGER;

CREATE TABLE IF NOT EXISTS match_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userOpenId TEXT NOT NULL,
  matchedOpenId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  accepted INTEGER
);

CREATE INDEX IF NOT EXISTS idx_match_history_user_pair
  ON match_history (userOpenId, matchedOpenId);

CREATE INDEX IF NOT EXISTS idx_match_history_created_at
  ON match_history (createdAt);
