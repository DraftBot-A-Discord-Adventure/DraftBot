-- Up

CREATE TABLE IF NOT EXISTS map_links( id INTEGER PRIMARY KEY, startMap INTEGER, endMap INTEGER, tripDuration INTEGER, updatedAt DATETIME, createdAt DATETIME);

CREATE TEMPORARY TABLE map_locations_backup( id INTEGER PRIMARY KEY, type TEXT NOT NULL, nameFr TEXT NOT NULL, nameEn TEXT NOT NULL, descFr TEXT NOT NULL, descEn TEXT NOT NULL, particleFr TEXT NOT NULL,particleEn TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO map_locations_backup SELECT id, type, nameFr, nameEn, descFr, descEn, particleFr, particleEn, updatedAt, createdAt FROM map_locations;
DROP TABLE map_locations;
CREATE TABLE map_locations ( id INTEGER PRIMARY KEY, type TEXT NOT NULL, nameFr TEXT NOT NULL, nameEn TEXT NOT NULL, descFr TEXT NOT NULL, descEn TEXT NOT NULL, particleFr TEXT NOT NULL, particleEn TEXT NOT NULL, updatedAt DATETIME, createdAt DATETIME);
INSERT INTO map_locations SELECT * FROM map_locations_backup;
DROP TABLE map_locations_backup;

-- Down
