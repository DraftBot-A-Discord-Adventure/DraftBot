-- Up

DELETE FROM inventory_slots WHERE slot = 1 AND itemId = 0;
UPDATE pet_entities SET lovePoints = 0 WHERE lovePoints < 0;
UPDATE pet_entities SET lovePoints = 100 WHERE lovePoints > 100;
UPDATE guilds SET level = 100 WHERE level > 100;
UPDATE guilds SET experience = 0 WHERE level = 100 AND experience != 0;

-- Down
