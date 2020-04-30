--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS entity (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT);

CREATE TABLE IF NOT EXISTS player (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, tampon INTEGER);

CREATE TABLE IF NOT EXISTS server (id TEXT, prefix TEXT, language TEXT);

CREATE TABLE IF NOT EXISTS inventory (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER);

CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER);

CREATE TABLE IF NOT EXISTS database (version TEXT, lastReset INTEGER);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
