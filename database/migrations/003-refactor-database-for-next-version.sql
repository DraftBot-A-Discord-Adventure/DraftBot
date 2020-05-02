--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TEMPORARY TABLE player_backup (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, guildId TEXT);
INSERT INTO player_backup SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player;
DROP TABLE player;
CREATE TABLE player (discordId VARCHAR(64) NOT NULL, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, lastReport DATETIME, badges TEXT, guildId VARCHAR(64));
INSERT INTO player SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player_backup;
UPDATE player SET badges = NULLIF(badges, '');
DROP TABLE player_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iup ON player (discordId);
CREATE INDEX IF NOT EXISTS ip ON player (score);
CREATE INDEX IF NOT EXISTS ip1 ON player (weeklyScore);
CREATE INDEX IF NOT EXISTS ip2 ON player (guildId);


DROP TABLE IF EXISTS database;
CREATE TABLE IF NOT EXISTS database (lastreset DATETIME);


CREATE TEMPORARY TABLE server_backup (id TEXT, prefix TEXT, language TEXT);
INSERT INTO server_backup SELECT id, prefix, language FROM server;
DROP TABLE server;
CREATE TABLE server (id VARCHAR(64) NOT NULL, prefix CHARACTER(10) NOT NULL, language CHARACTER(2) NOT NULL);
INSERT INTO server SELECT id, prefix, language FROM server_backup;
DROP TABLE server_backup;

CREATE UNIQUE INDEX IF NOT EXISTS ius ON server (id);


CREATE TEMPORARY TABLE entity_backup (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT);
INSERT INTO entity_backup SELECT id, maxHealth, health, attack, defense, speed, effect FROM entity;
DROP TABLE entity;
CREATE TABLE entity (id VARCHAR(64) NOT NULL, maxHealth INTEGER NOT NULL, health INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, effect VARCHAR(32) NOT NULL);
INSERT INTO entity SELECT id, maxHealth, health, attack, defense, speed, effect FROM entity_backup;
DROP TABLE entity_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iue ON entity (id);


CREATE TEMPORARY TABLE guild_backup (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER);
INSERT INTO guild_backup SELECT guildId, name, chief, score, level, experience, lastInvocation FROM guild;
DROP TABLE guild;
CREATE TABLE guild (guildId VARCHAR(64) NOT NULL, name VARCHAR(32) NOT NULL, chiefId VARCHAR(64) NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, lastInvocation DATETIME);
INSERT INTO guild SELECT guildId, name, chief, score, level, experience, lastInvocation FROM guild_backup;
DROP TABLE guild_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iug ON guild (guildId);
CREATE UNIQUE INDEX IF NOT EXISTS iug2 ON guild (chiefId);
CREATE INDEX IF NOT EXISTS ig ON guild (score);


CREATE TEMPORARY TABLE inventory_backup (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER);
INSERT INTO inventory_backup SELECT playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily FROM inventory;
DROP TABLE inventory;
CREATE TABLE inventory (playerId VARCHAR(64) NOT NULL, weaponId INTEGER NOT NULL, armorId INTEGER NOT NULL, potionId INTEGER NOT NULL, objectId INTEGER NOT NULL, backupItemId INTEGER NOT NULL, lastDaily DATETIME);
INSERT INTO inventory SELECT playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily FROM inventory_backup;
DROP TABLE inventory_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iui ON inventory (playerId);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
