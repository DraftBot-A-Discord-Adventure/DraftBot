-- Up

ALTER TABLE guilds ADD commonFood INTEGER;
ALTER TABLE guilds ADD herbivorousFood INTEGER;
ALTER TABLE guilds ADD carnivorousFood INTEGER;
ALTER TABLE guilds ADD ultimateFood INTEGER;

ALTER TABLE possibilities ADD oneshot BOOLEAN;
UPDATE possibilities SET oneshot = false;

CREATE TABLE IF NOT EXISTS shop(shopPotionId INTEGER, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO shop(shopPotionId, updatedAt, createdAt) VALUES(5, DATETIME('now'), DATETIME('now'));

UPDATE players SET nextEvent = null;

ALTER TABLE pets ADD diet TEXT;

-- Down 
