-- Add custom theme colors field to registries table
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS custom_theme_colors text;

