-- Up

ALTER TABLE entities ADD fightPointsLost INTEGER;
UPDATE entities SET fightPointsLost = 0;

-- Down
