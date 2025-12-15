-- Create enum types for better type safety
CREATE TYPE public.dept_key AS ENUM ('transportation', 'building', 'utilities', 'land_use');
CREATE TYPE public.gating_mode AS ENUM ('all', 'first');
CREATE TYPE public.dept_status AS ENUM ('pending', 'annotated', 'approved', 'locked');
CREATE TYPE public.section_key AS ENUM ('situation', 'guidance', 'nextsteps');
CREATE TYPE public.ticket_status AS ENUM ('draft', 'in_progress', 'completed');

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  from_field TEXT NOT NULL, -- 'from' is a SQL keyword, so using from_field
  body TEXT NOT NULL,
  departments dept_key[] NOT NULL,
  gating_mode gating_mode NOT NULL DEFAULT 'all',
  status ticket_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  department dept_key NOT NULL,
  section_key section_key NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  atoms JSONB DEFAULT '{}',
  status dept_status NOT NULL DEFAULT 'pending',
  annotations JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table for audit trail
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_sections_ticket_id ON public.sections(ticket_id);
CREATE INDEX idx_sections_department ON public.sections(department);
CREATE INDEX idx_sections_status ON public.sections(status);
CREATE INDEX idx_events_ticket_id ON public.events(ticket_id);
CREATE INDEX idx_events_timestamp ON public.events(timestamp DESC);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow public access for now (we can restrict later when auth is added)
CREATE POLICY "Allow all operations on tickets" ON public.tickets FOR ALL USING (true);
CREATE POLICY "Allow all operations on sections" ON public.sections FOR ALL USING (true);
CREATE POLICY "Allow all operations on events" ON public.events FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();