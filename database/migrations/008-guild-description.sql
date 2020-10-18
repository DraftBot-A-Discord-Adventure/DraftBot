-- Up

ALTER TABLE guilds ADD guildDescription TEXT
UPDATE guilds SET guildDescription = null

-- Down

