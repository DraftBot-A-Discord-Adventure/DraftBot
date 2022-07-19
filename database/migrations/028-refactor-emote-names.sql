-- Up

ALTER TABLE armors ADD COLUMN emote;
ALTER TABLE objects ADD COLUMN emote;
ALTER TABLE potions ADD COLUMN emote;
ALTER TABLE weapons ADD COLUMN emote;

ALTER TABLE armors ADD COLUMN fallbackEmote;
ALTER TABLE objects ADD COLUMN fallbackEmote;
ALTER TABLE weapons ADD COLUMN fallbackEmote;
ALTER TABLE potions ADD COLUMN fallbackEmote;

-- Down
