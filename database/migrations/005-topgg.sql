-- Up

ALTER TABLE players ADD topggVoteAt DATETIME;
UPDATE players SET topggVoteAt = DATETIME(0, 'unixepoch');

-- Down
