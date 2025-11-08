-- Add typography customization fields to registries table
ALTER TABLE registries
ADD COLUMN title_font_family text DEFAULT 'sans',
ADD COLUMN subtitle_font_family text DEFAULT 'sans',
ADD COLUMN body_font_family text DEFAULT 'sans';

