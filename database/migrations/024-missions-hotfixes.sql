-- Up

ALTER TABLE daily_mission ADD COLUMN lastDate DATETIME;
UPDATE daily_mission SET lastDate = date('now');
UPDATE players SET money = ROUND(players.money);
UPDATE players SET money = 0 WHERE money < 0;

-- Down
