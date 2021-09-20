-- Up

UPDATE guilds SET commonFood = 0 WHERE commonFood is null;
UPDATE guilds SET herbivorousFood = 0 WHERE herbivorousFood is null;
UPDATE guilds SET carnivorousFood = 0 WHERE carnivorousFood is null;
UPDATE guilds SET ultimateFood = 0 WHERE ultimateFood is null;
UPDATE guilds SET chief_id = 6 WHERE id = 2
UPDATE guilds SET chief_id = 7446 WHERE id = 173
UPDATE guilds SET chief_id = 7435 WHERE id = 163

-- Down
