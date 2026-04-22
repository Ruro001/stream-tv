-- This drops the old tables so we can recreate them with the correct type!
DROP TABLE IF EXISTS public.user_media_favorites;
DROP TABLE IF EXISTS public.user_media_progress;

-- Create user_media_favorites table
CREATE TABLE IF NOT EXISTS public.user_media_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Profile IDs are strings (Date.now()), NOT UUIDs!
    media_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id)
);

-- Create user_media_progress table
CREATE TABLE IF NOT EXISTS public.user_media_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Profile IDs are strings!
    media_id TEXT NOT NULL,
    timestamp NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id)
);

-- We disable RLS (Row Level Security) because sub-profiles don't directly link to auth.users.id
-- If you want strict security later, you will need to add an auth_id column and update App.tsx to pass it.
ALTER TABLE public.user_media_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_media_progress DISABLE ROW LEVEL SECURITY;

-- Create a trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_media_progress_modtime ON public.user_media_progress;

CREATE TRIGGER update_user_media_progress_modtime
    BEFORE UPDATE ON public.user_media_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
