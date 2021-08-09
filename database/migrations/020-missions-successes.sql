-- Up

CREATE TABLE IF NOT EXISTS PlayerSuccessesMissions( id INTEGER PRIMARY KEY, playerId INTEGER, missionSuccessId TEXT, strength INTEGER, isMission BOOLEAN, numberDone INTEGER, updatedAt DATETIME, createdAt DATETIME);

-- Down
