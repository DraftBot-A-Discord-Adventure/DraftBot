-- Up

UPDATE pet_entities SET lovepoints = 0 WHERE lovepoints < 0;
UPDATE player_missions_info SET campaignProgression = 1 WHERE campaignProgression = 2
UPDATE players SET money = CEIL(money)

-- Down
