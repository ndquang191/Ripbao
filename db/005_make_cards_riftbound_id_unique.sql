DELETE FROM cards AS duplicate
USING cards AS canonical
WHERE duplicate.riftbound_id = canonical.riftbound_id
  AND duplicate.id > canonical.id;

ALTER TABLE cards
  ADD CONSTRAINT cards_riftbound_id_key UNIQUE (riftbound_id);
