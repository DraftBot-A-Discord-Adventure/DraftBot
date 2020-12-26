-- Up

ALTER TABLE guilds ADD commonFood INTEGER;
ALTER TABLE guilds ADD herbivorousFood INTEGER;
ALTER TABLE guilds ADD carnivorousFood INTEGER;
ALTER TABLE guilds ADD ultimateFood INTEGER;

ALTER TABLE possibilities ADD oneshot BOOLEAN;
UPDATE possibilities SET oneshot = false;

CREATE TABLE IF NOT EXISTS shop(shop_potion_id INTEGER, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO shop(shop_potion_id, updatedAt, createdAt) VALUES(5, DATETIME('now'), DATETIME('now'));

UPDATE players SET nextEvent = 0;

-- Down 
