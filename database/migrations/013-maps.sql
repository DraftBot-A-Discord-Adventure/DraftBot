-- Up

CREATE TABLE IF NOT EXISTS map_locations (id INTEGER PRIMARY KEY, type TEXT NOT NULL, north_map INTEGER, east_map INTEGER, south_map INTEGER, west_map INTEGER, name_fr TEXT NOT NULL, name_en TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);

-- Down
