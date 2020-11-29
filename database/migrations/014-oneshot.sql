-- Up

ALTER TABLE possibilities ADD oneshot Boolean
UPDATE possibilities SET oneshot = false

-- Down 