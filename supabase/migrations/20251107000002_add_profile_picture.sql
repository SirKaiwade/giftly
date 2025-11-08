-- Add profile_picture_url column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url text DEFAULT '';

COMMENT ON COLUMN user_profiles.profile_picture_url IS 'URL to user profile picture (can be data URL or external URL)';

