CREATE TABLE IF NOT EXISTS users (
  openId     TEXT PRIMARY KEY,
  play       INTEGER NOT NULL DEFAULT 1,
  needCount  INTEGER NOT NULL DEFAULT 1,
  content    TEXT    NOT NULL DEFAULT '',
  sex        TEXT,
  imgUrl     TEXT,
  imgId      TEXT,
  needOpenId TEXT,
  activeHour INTEGER,
  voiceId    TEXT,
  msg        TEXT,
  msg_nd     TEXT,
  contact_   TEXT
);

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
