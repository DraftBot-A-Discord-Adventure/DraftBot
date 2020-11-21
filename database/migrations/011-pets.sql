-- Up

CREATE TABLE IF NOT EXISTS pets (id INTEGER PRIMARY KEY, rarity INTEGER NOT NULL, maleName_fr TEXT NOT NULL, maleName_en TEXT NOT NULL, femaleName_fr TEXT NOT NULL, femaleName_en TEXT NOT NULL, emoteMale TEXT NOT NULL, emoteFemale TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS pet_entities (id INTEGER PRIMARY KEY, pet_id INTEGER NOT NULL, sex CHAR, nickname TEXT, give_birth_date DATETIME, updatedAt DATETIME, createdAt DATETIME);
ALTER TABLE players ADD pet_id INTEGER;
ALTER TABLE players ADD last_pet_free DATETIME;
UPDATE players SET last_pet_free = DATETIME(0, 'unixepoch');
CREATE TABLE IF NOT EXISTS guild_pets (id INTEGER PRIMARY KEY, guild_id INTEGER NOT NULL, pet_entity_id INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);

-- Down

