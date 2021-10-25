-- Up

CREATE TABLE IF NOT EXISTS mission_slots(playerId INTEGER NOT NULL, missionId TEXT NOT NULL, missionVariant INTEGER NOT NULL, missionObjective INTEGER NOT NULL, expiresAt DATETIME, numberDone INTEGER NOT NULL, createdAt DATETIME, updatedAt DATETIME);
CREATE TABLE IF NOT EXISTS player_missions_info(playerId INTEGER PRIMARY KEY, gems INTEGER NOT NULL, dailyMissionNumberDone INTEGER NOT NULL, slotsCount INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS missions(id TEXT PRIMARY KEY, descFr TEXT NOT NULL, descEn TEXT NOT NULL, gems INTEGER NOT NULL, xp INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);

INSERT INTO mission_slots SELECT id, 'campaignIntro', 0, 1, NULL, 0, date('now'), date('now') FROM players;
INSERT INTO player_missions_info SELECT id, 0, 0, 1, date('now'), date('now') FROM players;

-- Down
