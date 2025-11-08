-- Add image_position and image_scale columns to registry_items table
ALTER TABLE registry_items 
ADD COLUMN IF NOT EXISTS image_position text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS image_scale numeric DEFAULT 1.0;

COMMENT ON COLUMN registry_items.image_position IS 'CSS object-position value (e.g., "center", "50% 30%")';
COMMENT ON COLUMN registry_items.image_scale IS 'Image scale factor (e.g., 1.5 for 150% zoom)';

