-- Check and update RLS policies more carefully
-- First, let's see what policies exist and update them properly

-- For tickets table - update existing policies or create new ones
DROP POLICY IF EXISTS "All authenticated users can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "All authenticated users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "All authenticated users can update all tickets" ON public.tickets;
DROP POLICY IF EXISTS "All authenticated users can delete all tickets" ON public.tickets;

-- Create new public access policies for tickets
CREATE POLICY "All authenticated users can view all tickets" 
  ON public.tickets 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create tickets" 
  ON public.tickets 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update all tickets" 
  ON public.tickets 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can delete all tickets" 
  ON public.tickets 
  FOR DELETE 
  TO authenticated
  USING (true);