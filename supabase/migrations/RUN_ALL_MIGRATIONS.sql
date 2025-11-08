-- Run all pending migrations in one go
-- Copy and paste this entire file into Supabase Dashboard → SQL Editor → New Query

-- Migration 1: Add typography font family fields (if not already run)
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS title_font_family text DEFAULT 'sans',
ADD COLUMN IF NOT EXISTS subtitle_font_family text DEFAULT 'sans',
ADD COLUMN IF NOT EXISTS body_font_family text DEFAULT 'sans';

-- Migration 2: Add custom theme colors field
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS custom_theme_colors text;

-- Migration 3: Add typography weight, style, and decoration fields
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

