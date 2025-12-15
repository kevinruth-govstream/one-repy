-- Update RLS policies to allow all authenticated users to access all tickets, sections, and events

-- Drop existing restrictive policies for tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;

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

-- Drop existing restrictive policies for sections
DROP POLICY IF EXISTS "Users can view their own sections" ON public.sections;
DROP POLICY IF EXISTS "Users can create their own sections" ON public.sections;
DROP POLICY IF EXISTS "Users can update their own sections" ON public.sections;
DROP POLICY IF EXISTS "Users can delete their own sections" ON public.sections;

-- Create new public access policies for sections
CREATE POLICY "All authenticated users can view all sections" 
  ON public.sections 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create sections" 
  ON public.sections 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update all sections" 
  ON public.sections 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can delete all sections" 
  ON public.sections 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Drop existing restrictive policies for events
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- Create new public access policies for events
CREATE POLICY "All authenticated users can view all events" 
  ON public.events 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create events" 
  ON public.events 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can update all events" 
  ON public.events 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can delete all events" 
  ON public.events 
  FOR DELETE 
  TO authenticated
  USING (true);