-- Up

CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER);

CREATE TEMPORARY TABLE player_backup (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, tampon INTEGER);
INSERT INTO player_backup SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player;
DROP TABLE player;
CREATE TABLE player (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, tampon INTEGER, guildId TEXT);
INSERT INTO player (discordId, score, weeklyScore, level, experience, money, lastReport, badges) SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges FROM player_backup;
DROP TABLE player_backup;

-- Down
