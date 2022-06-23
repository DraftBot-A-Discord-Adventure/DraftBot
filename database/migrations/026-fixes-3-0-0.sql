-- Up

UPDATE pet_entities SET lovepoints = 0 WHERE lovepoints < 0;
UPDATE player_missions_info SET campaignProgression = 1 WHERE campaignProgression = 2;
UPDATE players SET money = CEIL(money);

CREATE TEMPORARY TABLE pet_entities_backup (id INTEGER PRIMARY KEY, petId INTEGER NOT NULL, sex CHAR, nickname TEXT, giveBirthDate DATETIME, lovePoints INTEGER NOT NULL, hungrySince DATETIME, updatedAt DATETIME, createdAt DATETIME);
CREATE TEMPORARY TABLE guild_pets_backup (id INTEGER PRIMARY KEY, guildId INTEGER NOT NULL, petEntityId INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TEMPORARY TABLE players_backup (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, entityId INTEGER NOT NULL, guildId INTEGER, updatedAt DATETIME, createdAt DATETIME, topggVoteAt DATETIME, nextEvent INTEGER, class INTEGER, petId INTEGER, lastPetFree DATETIME, effectEndDate DATETIME, effectDuration INTEGER NOT NULL, mapLinkId INTEGER, startTravelDate DATETIME, effect TEXT,dmNotification BOOLEAN);
INSERT INTO pet_entities_backup SELECT id, petId, sex, nickname, giveBirthDate, lovePoints, hungrySince, updatedAt, createdAt FROM pet_entities WHERE pet_entities.id IN (SELECT id FROM (SELECT pet_entities.id AS id, COUNT() AS dupe FROM pet_entities LEFT JOIN guild_pets ON pet_entities.id=guild_pets.petEntityId LEFT JOIN players ON players.petId = pet_entities.id GROUP BY pet_entities.id ORDER BY dupe DESC) WHERE dupe = 1);
DELETE FROM pet_entities_backup WHERE id IN (SELECT petId FROM players WHERE petId IN (SELECT petEntityId FROM guild_pets))
INSERT INTO guild_pets_backup SELECT id, guildId, petEntityId, updatedAt, createdAt FROM guild_pets WHERE guild_pets.petEntityId IN (SELECT id FROM (SELECT pet_entities.id AS id, COUNT() AS dupe FROM pet_entities LEFT JOIN guild_pets ON pet_entities.id=guild_pets.petEntityId LEFT JOIN players ON players.petId = pet_entities.id GROUP BY pet_entities.id ORDER BY dupe DESC) WHERE dupe = 1);
DELETE FROM guild_pets_backup WHERE petEntityId IN (SELECT petId FROM players WHERE petId IN (SELECT petEntityId FROM guild_pets))
INSERT INTO players_backup SELECT id, score, weeklyScore, level, experience, money, badges, entityId, guildId, updatedAt, createdAt, topggVoteAt, nextEvent, class, petId, lastPetFree, effectEndDate, effectDuration, mapLinkId, startTravelDate, effect, dmNotification FROM players;
UPDATE players_backup SET petId = NULL WHERE petId NOT IN (SELECT id FROM (SELECT pet_entities.id AS id, COUNT() AS dupe FROM pet_entities LEFT JOIN guild_pets ON pet_entities.id=guild_pets.petEntityId LEFT JOIN players ON players.petId = pet_entities.id GROUP BY pet_entities.id ORDER BY dupe DESC) WHERE dupe = 1);
UPDATE players_backup SET petId = NULL WHERE petId IN (SELECT petId FROM players WHERE petId IN (SELECT petEntityId FROM guild_pets))
DROP TABLE pet_entities;
DROP TABLE guild_pets;
DROP TABLE players;
CREATE TABLE pet_entities (id INTEGER PRIMARY KEY, petId INTEGER NOT NULL, sex CHAR, nickname TEXT, giveBirthDate DATETIME, lovePoints INTEGER NOT NULL, hungrySince DATETIME, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE guild_pets (id INTEGER PRIMARY KEY, guildId INTEGER NOT NULL, petEntityId INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE players (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, entityId INTEGER NOT NULL, guildId INTEGER, updatedAt DATETIME, createdAt DATETIME, topggVoteAt DATETIME, nextEvent INTEGER, class INTEGER, petId INTEGER, lastPetFree DATETIME, effectEndDate DATETIME, effectDuration INTEGER NOT NULL, mapLinkId INTEGER, startTravelDate DATETIME, effect TEXT, dmNotification BOOLEAN);
INSERT INTO pet_entities SELECT id, petId, sex, nickname, giveBirthDate, lovePoints, hungrySince, updatedAt, createdAt FROM pet_entities_backup;
INSERT INTO guild_pets SELECT id, guildId, petEntityId, updatedAt, createdAt FROM guild_pets_backup;
INSERT INTO players SELECT id, score, weeklyScore, level, experience, money, badges, entityId, guildId, updatedAt, createdAt, topggVoteAt, nextEvent, class, petId, lastPetFree, effectEndDate, effectDuration, mapLinkId, startTravelDate, effect, dmNotification FROM players_backup;
DROP TABLE pet_entities_backup;
DROP TABLE guild_pets_backup;
DROP TABLE players_backup;

-- Down
