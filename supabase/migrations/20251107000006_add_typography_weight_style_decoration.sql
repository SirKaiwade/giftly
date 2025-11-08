-- Add typography weight, style, and decoration fields to registries table
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS title_font_weight text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS title_font_style text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS title_text_decoration text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subtitle_font_weight text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS subtitle_font_style text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS subtitle_text_decoration text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS body_font_weight text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS body_font_style text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS body_text_decoration text DEFAULT 'none';

