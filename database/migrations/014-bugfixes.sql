-- Up

UPDATE guilds SET commonFood = 0 WHERE commonFood is null;
UPDATE guilds SET herbivorousFood = 0 WHERE herbivorousFood is null;
UPDATE guilds SET carnivorousFood = 0 WHERE carnivorousFood is null;
UPDATE guilds SET ultimateFood = 0 WHERE ultimateFood is null;

-- Down 
