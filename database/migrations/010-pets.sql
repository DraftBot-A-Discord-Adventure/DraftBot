-- Up

CREATE TABLE IF NOT EXISTS pets (id INTEGER PRIMARY KEY, rarity INTEGER NOT NULL, maleName_fr TEXT NOT NULL, maleName_en TEXT NOT NULL, femaleName_fr TEXT NOT NULL, femaleName_en TEXT NOT NULL, emoteMale TEXT NOT NULL, emoteFemale TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
CREATE TABLE IF NOT EXISTS player_pets (id INTEGER PRIMARY KEY, slot INTEGER NOT NULL, player_id INTEGER NOT NULL, pet_id INTEGER NOT NULL, sex CHAR, nickname TEXT, updatedAt DATETIME, createdAt DATETIME);

-- Down

