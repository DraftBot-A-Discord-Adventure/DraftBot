-- Up

CREATE TABLE IF NOT EXISTS map_links( id INTEGER PRIMARY KEY, startMap INTEGER, endMap INTEGER, tripDuration INTEGER, updatedAt DATETIME, createdAt DATETIME);

CREATE TEMPORARY TABLE map_locations_backup( id INTEGER PRIMARY KEY, type TEXT NOT NULL, nameFr TEXT NOT NULL, nameEn TEXT NOT NULL, descFr TEXT NOT NULL, descEn TEXT NOT NULL, particleFr TEXT NOT NULL,particleEn TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO map_locations_backup SELECT id, type, nameFr, nameEn, descFr, descEn, particleFr, particleEn, updatedAt, createdAt FROM map_locations;
DROP TABLE map_locations;
CREATE TABLE map_locations ( id INTEGER PRIMARY KEY, type TEXT NOT NULL, nameFr TEXT NOT NULL, nameEn TEXT NOT NULL, descFr TEXT NOT NULL, descEn TEXT NOT NULL, particleFr TEXT NOT NULL, particleEn TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO map_locations SELECT * FROM map_locations_backup;
DROP TABLE map_locations_backup;
CREATE TABLE players_backup (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, entityId INTEGER NOT NULL, guildId INTEGER, updatedAt DATETIME, createdAt DATETIME, topggVoteAt DATETIME, nextEvent INTEGER, class INTEGER, petId INTEGER, lastPetFree DATETIME, effectEndDate DATETIME, effectDuration INTEGER NOT NULL, mapLinkId INTEGER, startTravelDate DATETIME, effect TEXT,dmNotification BOOLEAN);
INSERT INTO players_backup SELECT id INTEGER , score INTEGER , weeklyScore , level , experience , money , badges , entityId , guildId , updatedAt , createdAt , topggVoteAt , nextEvent , class , petId , lastPetFree , effectEndDate , effectDuration , NULL , startTravelDate, effect, dmnotification FROM players;
DROP TABLE players;
CREATE TABLE players (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, entityId INTEGER NOT NULL, guildId INTEGER, updatedAt DATETIME, createdAt DATETIME, topggVoteAt DATETIME, nextEvent INTEGER, class INTEGER, petId INTEGER, lastPetFree DATETIME, effectEndDate DATETIME, effectDuration INTEGER NOT NULL, mapLinkId INTEGER, startTravelDate DATETIME, effect TEXT,dmNotification BOOLEAN);
INSERT INTO players SELECT * FROM players_backup;
DROP TABLE players_backup;

ALTER TABLE player_small_events RENAME number TO time;

-- Down
