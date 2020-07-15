-- Up

INSERT INTO inventories(lastDailyAt, player_id, weapon_id, armor_id, potion_id, object_id, backup_id, updatedAt, createdAt) SELECT DATETIME(0, 'unixepoch'), id, 0, 0, 0, 0, 0, DATETIME('now'), DATETIME('now') FROM players WHERE NOT id IN (SELECT player_id FROM inventories);

-- Down
