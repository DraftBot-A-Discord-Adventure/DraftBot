-- Up

ALTER TABLE shop RENAME COLUMN shop_potion_id TO shopPotionId;
ALTER TABLE armors RENAME COLUMN french_masculine TO frenchMasculine;
ALTER TABLE armors RENAME COLUMN french_plural TO frenchPlural;
ALTER TABLE weapons RENAME COLUMN french_masculine TO frenchMasculine;
ALTER TABLE weapons RENAME COLUMN french_plural TO frenchPlural;
ALTER TABLE potions RENAME COLUMN french_masculine TO frenchMasculine;
ALTER TABLE potions RENAME COLUMN french_plural TO frenchPlural;
ALTER TABLE objects RENAME COLUMN french_masculine TO frenchMasculine;
ALTER TABLE objects RENAME COLUMN french_plural TO frenchPlural;
ALTER TABLE pet_entities RENAME COLUMN pet_id TO petId;
ALTER TABLE players RENAME COLUMN pet_id TO petId;
ALTER TABLE inventories RENAME COLUMN potion_id TO potionId;
ALTER TABLE servers RENAME COLUMN discordGuild_id TO discordGuildId;
ALTER TABLE events RENAME COLUMN restricted_maps TO restrictedMaps;
ALTER TABLE possibilities RENAME COLUMN restricted_maps TO restrictedMaps;
ALTER TABLE possibilities RENAME COLUMN event_id TO eventId;
ALTER TABLE event_map_location_ids RENAME COLUMN event_id TO eventId;
ALTER TABLE players RENAME COLUMN start_travel_date TO startTravelDate;
ALTER TABLE players RENAME COLUMN guild_id TO guildId;
ALTER TABLE guild_pets RENAME COLUMN guild_id TO guildId;
ALTER TABLE guilds RENAME COLUMN chief_id TO chiefId;
ALTER TABLE guilds RENAME COLUMN elder_id TO elderId;
ALTER TABLE players RENAME COLUMN map_id TO mapId;
ALTER TABLE players RENAME COLUMN previous_map_id TO previousMapId;
ALTER TABLE players RENAME COLUMN effect_duration TO effectDuration;
ALTER TABLE players RENAME COLUMN effect_end_date TO effectEndDate;
ALTER TABLE players RENAME COLUMN last_pet_free TO lastPetFree;
ALTER TABLE players RENAME COLUMN entity_id TO entityId;
ALTER TABLE guild_pets RENAME COLUMN pet_entity_id TO petEntityId;

-- Down
