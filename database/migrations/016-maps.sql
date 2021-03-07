-- Up

CREATE TABLE IF NOT EXISTS map_locations (id INTEGER PRIMARY KEY, type TEXT NOT NULL, north_map INTEGER, east_map INTEGER, south_map INTEGER, west_map INTEGER, name_fr TEXT NOT NULL, name_en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
ALTER TABLE players ADD previous_map_id INTEGER;
ALTER TABLE players ADD map_id INTEGER;
ALTER TABLE players ADD start_travel_date DATETIME;
UPDATE players SET start_travel_date = DATETIME(0, 'unixepoch');
UPDATE players SET map_id = 1;
CREATE TABLE IF NOT EXISTS player_small_events (id INTEGER PRIMARY KEY, player_id INTEGER NOT NULL, event_type TEXT NOT NULL, number INTEGER NOT NULL, updatedAt DATETIME, createdAt DATETIME);

-- Down
