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

-- Down
