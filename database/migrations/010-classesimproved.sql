-- Up

ALTER TABLE classes ADD price INTEGER;
ALTER TABLE classes ADD classgroup INTEGER;

update players set badges = players.badges||"-🔖" where players.class != 0 and players.badges is not null
update players set badges = "🔖" where badges is null and players.class != 0

UPDATE players SET players.class = 5 WHERE players.class = 2;
UPDATE players SET players.class = 9 WHERE players.class = 1;

-- Down

