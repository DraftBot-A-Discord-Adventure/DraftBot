-- Up

CREATE TEMPORARY TABLE player_backup (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, guildId TEXT);
INSERT INTO player_backup SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player;
DROP TABLE player;
CREATE TABLE players (id INTEGER PRIMARY KEY, entity_id VARCHAR(64) NOT NULL, score INTEGER NOT NULL, weeklyscore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, lastreport DATETIME, badges TEXT, guild_id VARCHAR(64));
INSERT INTO players (entity_id, score, weeklyscore, level, experience, money, lastreport, badges, guild_id) SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player_backup;
UPDATE players SET badges = NULLIF(badges, '');
DROP TABLE player_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iup ON players (entity_id);
CREATE INDEX IF NOT EXISTS ip ON players (score);
CREATE INDEX IF NOT EXISTS ip1 ON players (weeklyscore);
CREATE INDEX IF NOT EXISTS ip2 ON players (guild_id);

DROP TABLE IF EXISTS database;
CREATE TABLE IF NOT EXISTS databases (lastreset DATETIME);

CREATE TEMPORARY TABLE server_backup (id TEXT, prefix TEXT, language TEXT);
INSERT INTO server_backup SELECT id, prefix, language FROM server;
DROP TABLE server;
CREATE TABLE servers (id VARCHAR(64) NOT NULL, prefix CHARACTER(10) NOT NULL, language CHARACTER(2) NOT NULL);
INSERT INTO servers SELECT id, prefix, language FROM server_backup;
DROP TABLE server_backup;

CREATE UNIQUE INDEX IF NOT EXISTS ius ON servers (id);

CREATE TEMPORARY TABLE entity_backup (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT);
INSERT INTO entity_backup SELECT id, maxHealth, health, attack, defense, speed, effect FROM entity;
DROP TABLE entity;
CREATE TABLE entities (id VARCHAR(64) NOT NULL, maxhealth INTEGER NOT NULL, health INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, effect VARCHAR(32) NOT NULL);
INSERT INTO entities SELECT id, maxHealth, health, attack, defense, speed, effect FROM entity_backup;
DROP TABLE entity_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iue ON entities (id);

CREATE TEMPORARY TABLE guild_backup (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER);
INSERT INTO guild_backup SELECT guildId, name, chief, score, level, experience, lastInvocation FROM guild;
DROP TABLE guild;
CREATE TABLE guilds (id VARCHAR(64) NOT NULL, name VARCHAR(32) NOT NULL, chief_id VARCHAR(64) NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, lastinvocation DATETIME);
INSERT INTO guilds (id, name, chief_id, score, level, experience, lastinvocation) SELECT guildId, name, chief, score, level, experience, lastInvocation FROM guild_backup;
DROP TABLE guild_backup;

CREATE INDEX IF NOT EXISTS iug ON guilds (id);
CREATE UNIQUE INDEX IF NOT EXISTS iug2 ON guilds (chief_id);
CREATE INDEX IF NOT EXISTS ig ON guilds (score);

CREATE TEMPORARY TABLE inventory_backup (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER);
INSERT INTO inventory_backup SELECT playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily FROM inventory;
DROP TABLE inventory;
CREATE TABLE inventories (id INTEGER PRIMARY KEY, player_id VARCHAR(64) NOT NULL, weapon_id INTEGER NOT NULL, armor_id INTEGER NOT NULL, potion_id INTEGER NOT NULL, object_id INTEGER NOT NULL, backup_id INTEGER NOT NULL, lastdaily DATETIME);
INSERT INTO inventories (player_id, weapon_id, armor_id, potion_id, object_id, backup_id, lastdaily) SELECT playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily FROM inventory_backup;
DROP TABLE inventory_backup;

CREATE UNIQUE INDEX IF NOT EXISTS iui ON inventories (player_id);

-- Down
