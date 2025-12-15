-- Update sections table policies
DROP POLICY IF EXISTS "All authenticated users can view all sections" ON public.sections;
DROP POLICY IF EXISTS "All authenticated users can create sections" ON public.sections;
DROP POLICY IF EXISTS "All authenticated users can update all sections" ON public.sections;
DROP POLICY IF EXISTS "All authenticated users can delete all sections" ON public.sections;

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

-- Update events table policies
DROP POLICY IF EXISTS "All authenticated users can view all events" ON public.events;
DROP POLICY IF EXISTS "All authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "All authenticated users can update all events" ON public.events;
DROP POLICY IF EXISTS "All authenticated users can delete all events" ON public.events;

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