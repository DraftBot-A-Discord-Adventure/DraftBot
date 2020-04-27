--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER);

ALTER TABLE player ADD guildId TEXT;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
