-- Up

-- Must create a useless primary in order to make sequelize hasMany working, as it doesn't work if there is no primary key
CREATE TABLE IF NOT EXISTS mission_slots(id INTEGER PRIMARY KEY, playerId INTEGER NOT NULL, missionId TEXT NOT NULL, missionVariant INTEGER NOT NULL, missionObjective INTEGER NOT NULL, expiresAt DATETIME, numberDone INTEGER NOT NULL, createdAt DATETIME, updatedAt DATETIME);
CREATE TABLE IF NOT EXISTS player_missions_info(playerId INTEGER PRIMARY KEY, gems INTEGER NOT NULL, hasBoughtPointsThisWeek BOOLEAN NOT NULL, dailyMissionNumberDone INTEGER NOT NULL, lastDailyMissionCompleted DATETIME, slotsCount INTEGER NOT NULL, campaignProgression INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS missions(id TEXT PRIMARY KEY, descFr TEXT NOT NULL, descEn TEXT NOT NULL, campaignOnly INTEGER NOT NULL, gems INTEGER NOT NULL, xp INTEGER NOT NULL, baseDifficulty INTEGER NOT NULL, baseDuration INTEGER, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS daily_mission(missionId TEXT, objective INTEGER NOT NULL, variant INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);

INSERT INTO mission_slots SELECT NULL, id, 'campaignIntro', 0, 1, NULL, 0, date('now'), date('now') FROM players;
INSERT INTO player_missions_info SELECT id, 0, false, 0, NULL, 1, 0, date('now'), date('now') FROM players;

-- Down
