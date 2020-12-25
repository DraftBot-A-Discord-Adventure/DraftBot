-- Up

ALTER TABLE guilds ADD commonFood INTEGER;
ALTER TABLE guilds ADD rareFood INTEGER;
ALTER TABLE guilds ADD uniqueFood INTEGER;

ALTER TABLE possibilities ADD oneshot Boolean;
UPDATE possibilities SET oneshot = false;

CREATE TABLE IF NOT EXISTS shop(shop_potion_id INTEGER, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO shop(shop_potion_id, updatedAt, createdAt) VALUES(5, DATETIME('now'), DATETIME('now'));

-- Down 
