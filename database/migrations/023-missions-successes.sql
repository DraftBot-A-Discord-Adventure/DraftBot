-- Up

-- Must create a useless primary in order to make sequelize hasMany working, as it doesn't work if there is no primary key
CREATE TABLE IF NOT EXISTS mission_slots(id INTEGER PRIMARY KEY, playerId INTEGER NOT NULL, missionId TEXT NOT NULL, missionVariant INTEGER NOT NULL, missionObjective INTEGER NOT NULL, expiresAt DATETIME, numberDone INTEGER NOT NULL, gemsToWin INTEGER NOT NULL, xpToWin INTEGER NOT NULL, createdAt DATETIME, updatedAt DATETIME);
CREATE TABLE IF NOT EXISTS player_missions_info(playerId INTEGER PRIMARY KEY, gems INTEGER NOT NULL, hasBoughtPointsThisWeek BOOLEAN NOT NULL, dailyMissionNumberDone INTEGER NOT NULL, lastDailyMissionCompleted DATETIME, campaignProgression INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS missions(id TEXT PRIMARY KEY, descFr TEXT NOT NULL, descEn TEXT NOT NULL, campaignOnly INTEGER NOT NULL, canBeDaily INTEGER NOT NULL, canBeEasy INTEGER NOT NULL, canBeMedium INTEGER NOT NULL, canBeHard INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS daily_mission(missionId TEXT, objective INTEGER NOT NULL, variant INTEGER NOT NULL, gemsToWin INTEGER NOT NULL, xpToWin INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS tags(id INTEGER PRIMARY KEY, textTag VARCHAR(64) NOT NULL, idObject INTEGER NOT NULL, typeObject VARCHAR(64) NOT NULL, updatedAt DATETIME, createdAt DATETIME);

INSERT INTO player_missions_info SELECT id, 0, false, 0, NULL, 1, 1, date('now'), date('now') FROM players;

-- Down
