-- Up

ALTER TABLE players ADD nextEvent INTEGER;
UPDATE players SET nextEvent = null;
ALTER TABLE possibilities ADD nextEvent INTEGER;
UPDATE possibilities SET nextEvent = null;

-- Down
