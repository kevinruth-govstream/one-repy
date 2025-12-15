-- Add user_id columns to all tables for user ownership
ALTER TABLE public.tickets 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sections 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL after we populate existing data
-- First, create a default system user for existing data
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Insert a system user if it doesn't exist
    INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'system@onereply.gov',
        now(),
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Update existing records to have the system user
    UPDATE public.tickets SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
    UPDATE public.sections SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
    UPDATE public.events SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
END $$;

-- Now make user_id NOT NULL
ALTER TABLE public.tickets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sections ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN user_id SET NOT NULL;

-- Drop the dangerous public policies
DROP POLICY IF EXISTS "Allow all operations on tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow all operations on sections" ON public.sections;
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;

-- Create secure user-specific RLS policies
-- Tickets policies
CREATE POLICY "Users can view their own tickets" 
ON public.tickets FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" 
ON public.tickets FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" 
ON public.tickets FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets" 
ON public.tickets FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Sections policies
CREATE POLICY "Users can view their own sections" 
ON public.sections FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sections" 
ON public.sections FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sections" 
ON public.sections FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sections" 
ON public.sections FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view their own events" 
ON public.events FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.events FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.events FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.events FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);