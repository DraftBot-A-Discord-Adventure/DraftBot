-- Up

DELETE FROM inventory_slots WHERE slot = 1 AND itemId = 0;
UPDATE pet_entities SET lovePoints = 0 WHERE lovePoints < 0;
UPDATE pet_entities SET lovePoints = 100 WHERE lovePoints > 100;

-- Down
