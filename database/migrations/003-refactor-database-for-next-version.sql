-- Up

DROP TABLE IF EXISTS database;
CREATE TABLE IF NOT EXISTS databases (id INTEGER PRIMARY KEY, lastResetAt DATETIME, updatedAt DATETIME, createdAt DATETIME);

CREATE TEMPORARY TABLE server_backup (id TEXT, prefix TEXT, language TEXT);
INSERT INTO server_backup SELECT id, prefix, language FROM server;
DROP TABLE server;
CREATE TABLE servers (id INTEGER PRIMARY KEY, prefix CHARACTER(10) NOT NULL, language CHARACTER(2) NOT NULL, discordGuild_id VARCHAR(64) NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO servers (prefix, language, discordGuild_id, updatedAt, createdAt) SELECT prefix, language, id, DATETIME('now'), DATETIME('now') FROM server_backup;
DROP TABLE server_backup;
CREATE UNIQUE INDEX IF NOT EXISTS ius ON servers (discordGuild_id);

CREATE TEMPORARY TABLE entity_backup (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT);
INSERT INTO entity_backup SELECT id, maxHealth, health, attack, defense, speed, effect FROM entity;
DROP TABLE entity;
CREATE TABLE entities (id INTEGER PRIMARY KEY, maxHealth INTEGER NOT NULL, health INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, effect VARCHAR(32) NOT NULL, discordUser_id VARCHAR(64) NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO entities (maxHealth, health, attack, defense, speed, effect, discordUser_id, updatedAt, createdAt) SELECT maxHealth, health, attack, defense, speed, effect, id, DATETIME('now'), DATETIME('now') FROM entity_backup;
DROP TABLE entity_backup;
CREATE UNIQUE INDEX IF NOT EXISTS iue ON entities (discordUser_id);

CREATE TEMPORARY TABLE player_backup (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, guildId TEXT);
INSERT INTO player_backup SELECT discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId FROM player;
DROP TABLE player;
CREATE TABLE players (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, lastReportAt DATETIME, entity_id INTEGER NOT NULL, guild_id VARCHAR(64), updatedAt DATETIME, createdAt DATETIME, oldDiscordId VARCHAR(64), oldGuildId VARCHAR(64));
INSERT INTO players (score, weeklyscore, level, experience, money, badges, entity_id, updatedAt, createdAt, oldDiscordId, oldGuildId) SELECT pb.score, pb.weeklyScore, pb.level, pb.experience, pb.money, pb.badges, e.id, DATETIME('now'), DATETIME('now'), pb.discordId, pb.guildId FROM player_backup as pb JOIN entities as e ON pb.discordId = e.discordUser_id;

CREATE TEMPORARY TABLE inventory_backup (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER);
INSERT INTO inventory_backup SELECT playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily FROM inventory;
DROP TABLE inventory;
CREATE TABLE inventories (id INTEGER PRIMARY KEY, lastDailyAt DATETIME, player_id INTEGER NOT NULL, weapon_id INTEGER NOT NULL, armor_id INTEGER NOT NULL, potion_id INTEGER NOT NULL, object_id INTEGER NOT NULL, backup_id INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO inventories (player_id, weapon_id, armor_id, potion_id, object_id, backup_id, updatedAt, createdAt) SELECT p.id, ib.weaponId, ib.armorId, ib.potionId, ib.objectId, ib.backupItemId, DATETIME('now'), DATETIME('now') FROM inventory_backup as ib JOIN players as p ON p.oldDiscordId = ib.playerId;
UPDATE inventories SET lastDailyAt = NULL;
UPDATE inventories SET weapon_id = 0 WHERE weapon_id = 'default';
UPDATE inventories SET armor_id = 0 WHERE armor_id = 'default';
UPDATE inventories SET potion_id = 0 WHERE potion_id = 'default';
UPDATE inventories SET object_id = 0 WHERE object_id = 'default';
UPDATE inventories SET backup_id = 0 WHERE backup_id = 'default';
DROP TABLE inventory_backup;
CREATE UNIQUE INDEX IF NOT EXISTS iui ON inventories (player_id);

CREATE TEMPORARY TABLE guild_backup (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER);
INSERT INTO guild_backup SELECT guildId, name, chief, score, level, experience, lastInvocation FROM guild;
DROP TABLE guild;
CREATE TABLE guilds (id INTEGER PRIMARY KEY, name VARCHAR(32) NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, lastDailyAt DATETIME, chief_id INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME, oldGuildId TEXT);
INSERT INTO guilds (name, score, level, experience, chief_id, updatedAt, createdAt, oldGuildId) SELECT gb.name, gb.score, gb.level, gb.experience, p.id, DATETIME('now'), DATETIME('now'), gb.guildId FROM guild_backup as gb JOIN players as p ON gb.chief = p.oldDiscordId;

DROP TABLE guild_backup;
DROP TABLE player_backup;

CREATE TEMPORARY TABLE player_backup (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, lastReportAt DATETIME, entity_id INTEGER NOT NULL, guild_id VARCHAR(64), updatedAt DATETIME, createdAt DATETIME, oldDiscordId VARCHAR(64), oldGuildId VARCHAR(64));
INSERT INTO player_backup SELECT id, score, weeklyScore, level, experience, money, badges, lastReportAt, entity_id, guild_id, updatedAt, createdAt, oldGuildId, oldGuildId FROM players;
DROP TABLE players;
CREATE TABLE players (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, lastReportAt DATETIME, entity_id INTEGER NOT NULL, guild_id INTEGER, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO players (id, score, weeklyscore, level, experience, money, badges, entity_id, guild_id, updatedAt, createdAt) SELECT pb.id, pb.score, pb.weeklyScore, pb.level, pb.experience, pb.money, pb.badges, pb.entity_id, g.id, pb.updatedAt, pb.createdAt FROM player_backup as pb LEFT JOIN guilds as g ON pb.oldGuildId = g.oldGuildId;
UPDATE players SET badges = NULLIF(badges, '');
UPDATE players SET lastReportAt = NULL;
CREATE UNIQUE INDEX IF NOT EXISTS iup ON players (entity_id);
CREATE INDEX IF NOT EXISTS ip ON players (score);
CREATE INDEX IF NOT EXISTS ip1 ON players (weeklyscore);
CREATE INDEX IF NOT EXISTS ip2 ON players (guild_id);
DROP TABLE player_backup;

CREATE TEMPORARY TABLE guild_backup (id INTEGER PRIMARY KEY, name VARCHAR(32) NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, lastDailyAt DATETIME, chief_id INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO guild_backup SELECT id, name, score, level, experience, lastDailyAt, chief_id, updatedAt, createdAt FROM guilds;
DROP TABLE guilds;
CREATE TABLE guilds (id INTEGER PRIMARY KEY, name VARCHAR(32) NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, lastDailyAt DATETIME, chief_id INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO guilds (id, name, score, level, experience, chief_id, updatedAt, createdAt) SELECT id, name, score, level, experience, chief_id, updatedAt, createdAt FROM guild_backup;
UPDATE guilds SET lastDailyAt = NULL;
CREATE UNIQUE INDEX IF NOT EXISTS iug2 ON guilds (chief_id);
CREATE INDEX IF NOT EXISTS ig ON guilds (score);
DROP TABLE guild_backup;

CREATE TABLE IF NOT EXISTS armors (id INTEGER PRIMARY KEY, rarity INTEGER NOT NULL, rawAttack INTEGER NOT NULL, rawDefense INTEGER NOT NULL, rawSpeed INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, fr TEXT NOT NULL, en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS weapons (id INTEGER PRIMARY KEY, rarity INTEGER NOT NULL, rawAttack INTEGER NOT NULL, rawDefense INTEGER NOT NULL, rawSpeed INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, fr TEXT NOT NULL, en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS potions (id INTEGER PRIMARY KEY, rarity INTEGER NOT NULL, power INTEGER NOT NULL, nature INTEGER NOT NULL, fr TEXT NOT NULL, en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS objects (id INTEGER PRIMARY KEY, rarity INTEGER NOT NULL, power INTEGER NOT NULL, nature INTEGER NOT NULL, fr TEXT NOT NULL, en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, fr TEXT NOT NULL, en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS possibilities (id INTEGER PRIMARY KEY, possibilityKey VARCHAR(32) NOT NULL, lostTime INTEGER NOT NULL, health INTEGER NOT NULL, effect VARCHAR(32) NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, item BOOLEAN NOT NULL, fr TEXT NOT NULL, en TEXT NOT NULL, event_id INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE INDEX IF NOT EXISTS ip3 ON possibilities (event_id);
CREATE INDEX IF NOT EXISTS ip4 ON possibilities (possibilityKey);

-- Down
