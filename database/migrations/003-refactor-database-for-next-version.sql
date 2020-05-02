--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TEMPORARY TABLE player_backup (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, guildId TEXT);
INSERT INTO player_backup SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player;
DROP TABLE player;
CREATE TABLE player(discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, guildId TEXT);
INSERT INTO player SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player_backup;
DROP TABLE player_backup;

DROP TABLE IF EXISTS database;

CREATE TABLE IF NOT EXISTS database (lastweekReset INTEGER);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
