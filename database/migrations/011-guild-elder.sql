-- Up

ALTER TABLE guilds ADD elder_id INTEGER
UPDATE guilds SET elder_id = null

-- Down 
