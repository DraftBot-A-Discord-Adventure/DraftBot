-- Up

UPDATE mission_slots SET missionId = 'rankedFight', missionVariant = 0, missionObjective = 10, numberDone = 0 WHERE missionId = 'finishWithAttack';
UPDATE mission_slots SET missionId = 'rankedFight', missionVariant = 0, missionObjective = 5, numberDone = 0 WHERE missionId = 'fightAttacks';

-- Down
