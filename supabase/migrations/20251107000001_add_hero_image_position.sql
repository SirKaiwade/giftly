-- Add hero_image_position column to registries table
-- This allows users to customize the positioning of hero images (object-position CSS)

ALTER TABLE registries 
ADD COLUMN IF NOT EXISTS hero_image_position text DEFAULT 'center';

COMMENT ON COLUMN registries.hero_image_position IS 'CSS object-position value for hero image (e.g., "center", "top", "50% 30%")';

