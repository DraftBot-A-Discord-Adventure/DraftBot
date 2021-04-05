-- Up

ALTER TABLE players ADD dmnotification BOOLEAN
UPDATE players SET dmnotification = true

-- Down 
