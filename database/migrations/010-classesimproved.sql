-- Up

ALTER TABLE classes ADD price INTEGER;
ALTER TABLE classes ADD classgroup INTEGER;
UPDATE players SET class = 5 WHERE players.class = 2;
UPDATE players SET class = 9 WHERE players.class = 1;

-- Down

