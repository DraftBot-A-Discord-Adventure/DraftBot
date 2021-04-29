-- Up

CREATE TEMPORARY TABLE players_backup (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, entity_id INTEGER NOT NULL, guild_id INTEGER, updatedAt DATETIME, createdAt DATETIME, topggVoteAt DATETIME, nextEvent INTEGER, class INTEGER, pet_id INTEGER, last_pet_free DATETIME, effect_end_date DATETIME, effect_duration INTEGER NOT NULL, previous_map_id INTEGER, map_id INTEGER, start_travel_date DATETIME, effect TEXT);
INSERT INTO players_backup SELECT id, score, weeklyScore, level, experience, money, badges, entity_id, guild_id, updatedAt, createdAt, topggVoteAt, nextEvent, class, pet_id, last_pet_free, DATETIME(0,'unixepoch'), 0, -1, -1, DATETIME(0,'unixepoch'), ':smiley:' FROM players;
DROP TABLE players;
CREATE TABLE players (id INTEGER PRIMARY KEY, score INTEGER NOT NULL, weeklyScore INTEGER NOT NULL, level INTEGER NOT NULL, experience INTEGER NOT NULL, money INTEGER NOT NULL, badges TEXT, entity_id INTEGER NOT NULL, guild_id INTEGER, updatedAt DATETIME, createdAt DATETIME, topggVoteAt DATETIME, nextEvent INTEGER, class INTEGER, pet_id INTEGER, last_pet_free DATETIME, effect_end_date DATETIME, effect_duration INTEGER NOT NULL, previous_map_id INTEGER, map_id INTEGER, start_travel_date DATETIME, effect TEXT);
INSERT INTO players SELECT * FROM players_backup;
DROP TABLE players_backup;

CREATE TABLE IF NOT EXISTS map_locations (id INTEGER PRIMARY KEY, type TEXT NOT NULL, north_map INTEGER, east_map INTEGER, south_map INTEGER, west_map INTEGER, name_fr TEXT NOT NULL, name_en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS player_small_events (id INTEGER PRIMARY KEY, player_id INTEGER NOT NULL, event_type TEXT NOT NULL, number INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);
ALTER TABLE armors ADD french_masculine INTEGER;
ALTER TABLE armors ADD french_plural INTEGER;
ALTER TABLE weapons ADD french_masculine INTEGER;
ALTER TABLE weapons ADD french_plural INTEGER;
ALTER TABLE potions ADD french_masculine INTEGER;
ALTER TABLE potions ADD french_plural INTEGER;
ALTER TABLE objects ADD french_masculine INTEGER;
ALTER TABLE objects ADD french_plural INTEGER;

CREATE TEMPORARY TABLE entity_backup (id INTEGER PRIMARY KEY, maxHealth INTEGER NOT NULL, health INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, fightPointsLost INTEGER, discordUser_id VARCHAR(64) NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO entity_backup SELECT id, maxHealth, health, attack, defense, speed, fightPointsLost, discordUser_id, updatedAt, createdAt FROM entities;
DROP TABLE entities;
CREATE TABLE entities (id INTEGER PRIMARY KEY, maxHealth INTEGER NOT NULL, health INTEGER NOT NULL, attack INTEGER NOT NULL, defense INTEGER NOT NULL, speed INTEGER NOT NULL, fightPointsLost INTEGER, discordUser_id VARCHAR(64) NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO entities SELECT * FROM entity_backup;
DROP TABLE entity_backup;

-- Down
