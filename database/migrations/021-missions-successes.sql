-- Up

CREATE TABLE IF NOT EXISTS player_missions_successes( id INTEGER PRIMARY KEY, playerId INTEGER, missionSuccessId TEXT, strength INTEGER, isMission BOOLEAN, numberDone INTEGER, updatedAt DATETIME, createdAt DATETIME);

CREATE TABLE IF NOT EXISTS missions_successes( id INTEGER PRIMARY KEY, titleFr TEXT, titleEn TEXT, descriptionFr TEXT, descriptionEn TEXT, updatedAt DATETIME, createdAt DATETIME);

-- Down
