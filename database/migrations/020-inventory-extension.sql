-- Up

CREATE TABLE IF NOT EXISTS inventory_slots (playerId INTEGER NOT NULL, slot INTEGER NOT NULL, itemCategory INTEGER NOT NULL, itemId INTEGER NOT NULL, createdAt DATETIME, updatedAt DATETIME, PRIMARY KEY(playerId, slot, itemCategory));
CREATE TABLE IF NOT EXISTS inventory_info (playerId INTEGER PRIMARY KEY, lastDailyAt DATETIME, weaponSlots INTEGER NOT NULL, armorSlots INTEGER NOT NULL, potionSlots INTEGER NOT NULL, objectSlots INTEGER NOT NULL, createdAt DATETIME, updatedAt DATETIME);

INSERT INTO inventory_info SELECT playerId, lastDailyAt, 1, 1, 1, 2, date('now'), date('now') FROM inventories;
INSERT INTO inventory_slots SELECT playerId, 0, 0, weaponId, date('now'), date('now') FROM inventories;
INSERT INTO inventory_slots SELECT playerId, 0, 1, armorId, date('now'), date('now') FROM inventories;
INSERT INTO inventory_slots SELECT playerId, 0, 2, potionId, date('now'), date('now') FROM inventories;
INSERT INTO inventory_slots SELECT playerId, 0, 3, objectId, date('now'), date('now') FROM inventories;
INSERT INTO inventory_slots SELECT playerId, 1, 3, backupId, date('now'), date('now') FROM inventories;

DROP TABLE inventories;

-- Down
