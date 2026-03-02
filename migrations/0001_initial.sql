-- CoreNet AWA Migration: Initial Schema
-- Tables: sessions, session_features, participants, votes, comments

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	code TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL DEFAULT 'Designing Workplaces That Think',
	created_at TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS session_features (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	session_id TEXT NOT NULL REFERENCES sessions(id),
	feature_id INTEGER NOT NULL,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	category TEXT NOT NULL,
	has_evidence INTEGER NOT NULL DEFAULT 0,
	level TEXT NOT NULL DEFAULT 'neither',
	caption TEXT,
	UNIQUE(session_id, feature_id)
);

CREATE INDEX IF NOT EXISTS sf_session_idx ON session_features(session_id);

CREATE TABLE IF NOT EXISTS participants (
	id TEXT PRIMARY KEY,
	session_id TEXT NOT NULL REFERENCES sessions(id),
	name TEXT,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS participants_session_idx ON participants(session_id);

CREATE TABLE IF NOT EXISTS votes (
	id TEXT PRIMARY KEY,
	participant_id TEXT NOT NULL REFERENCES participants(id),
	session_id TEXT NOT NULL REFERENCES sessions(id),
	phase TEXT NOT NULL,
	feature_id INTEGER NOT NULL,
	UNIQUE(participant_id, phase, feature_id)
);

CREATE INDEX IF NOT EXISTS votes_session_idx ON votes(session_id);

CREATE TABLE IF NOT EXISTS comments (
	id TEXT PRIMARY KEY,
	participant_id TEXT NOT NULL REFERENCES participants(id),
	session_id TEXT NOT NULL REFERENCES sessions(id),
	text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_session_idx ON comments(session_id);
