-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('global', 'regional', 'local')),
  event_type TEXT NOT NULL CHECK (event_type IN ('sports', 'cultural', 'religious', 'festival', 'holiday', 'seasonal')),
  start_date DATE NOT NULL,
  end_date DATE,
  location_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'Brasil',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  icon_name TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'yearly', 'monthly', etc.
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events(country, state, city);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active events
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (is_active = true);

-- Policy: Only authenticated users can insert/update events
CREATE POLICY "Authenticated users can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update events" ON public.events
  FOR UPDATE TO authenticated USING (true);

-- Create saved_events table for user favorites
CREATE TABLE IF NOT EXISTS public.saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notification_enabled BOOLEAN DEFAULT false,
  UNIQUE(user_id, event_id)
);

-- Enable RLS for saved_events
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved events
CREATE POLICY "Users can view own saved events" ON public.saved_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved events" ON public.saved_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved events" ON public.saved_events
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved events" ON public.saved_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample events
INSERT INTO public.events (name, description, category, event_type, start_date, end_date, location_name, city, state, country, latitude, longitude, icon_name, color, is_recurring, recurrence_pattern, popularity_score) VALUES
-- Eventos Globais
('Ano Novo', 'Celebração mundial da chegada do novo ano', 'global', 'holiday', '2026-01-01', '2026-01-01', 'Mundial', NULL, NULL, 'Mundial', NULL, NULL, 'Calendar', '#FFD700', true, 'yearly', 100),
('Dia Internacional da Mulher', 'Celebração dos direitos e conquistas das mulheres', 'global', 'holiday', '2026-03-08', '2026-03-08', 'Mundial', NULL, NULL, 'Mundial', NULL, NULL, 'Heart', '#FF69B4', true, 'yearly', 90),
('Dia da Terra', 'Conscientização ambiental global', 'global', 'seasonal', '2026-04-22', '2026-04-22', 'Mundial', NULL, NULL, 'Mundial', NULL, NULL, 'Globe', '#22C55E', true, 'yearly', 85),
('Natal', 'Celebração natalina mundial', 'global', 'religious', '2025-12-25', '2025-12-25', 'Mundial', NULL, NULL, 'Mundial', NULL, NULL, 'Gift', '#DC2626', true, 'yearly', 100),

-- Copa do Mundo 2026
('Copa do Mundo FIFA 2026', 'Mundial de futebol sediado em América do Norte', 'global', 'sports', '2026-06-11', '2026-07-19', 'América do Norte', NULL, NULL, 'EUA/Canadá/México', NULL, NULL, 'Trophy', '#FFD700', false, NULL, 100),

-- Eventos Regionais - Brasil
('Carnaval', 'Maior festa popular do Brasil', 'regional', 'festival', '2026-02-14', '2026-02-17', 'Brasil', NULL, NULL, 'Brasil', NULL, NULL, 'Music', '#9333EA', true, 'yearly', 100),
('Festas Juninas', 'Celebração das festas de São João', 'regional', 'cultural', '2026-06-01', '2026-06-30', 'Brasil', NULL, NULL, 'Brasil', NULL, NULL, 'Flame', '#F59E0B', true, 'yearly', 95),
('Oktoberfest', 'Festival de cerveja típico alemão', 'regional', 'festival', '2025-10-08', '2025-10-26', 'Blumenau', 'Blumenau', 'Santa Catarina', 'Brasil', -26.9194, -49.0661, 'Beer', '#F97316', true, 'yearly', 90),

-- Eventos Locais - Norte
('Festival Folclórico de Parintins', 'Disputa entre Bois Garantido e Caprichoso', 'local', 'cultural', '2026-06-26', '2026-06-28', 'Parintins', 'Parintins', 'Amazonas', 'Brasil', -2.6283, -56.7358, 'Music', '#DC2626', true, 'yearly', 95),
('Círio de Nazaré', 'Maior procissão católica do Brasil', 'local', 'religious', '2025-10-12', '2025-10-12', 'Belém', 'Belém', 'Pará', 'Brasil', -1.4558, -48.5039, 'Church', '#3B82F6', true, 'yearly', 95),

-- Eventos Locais - Nordeste
('Carnaval de Salvador', 'Maior carnaval de rua do mundo', 'local', 'festival', '2026-02-14', '2026-02-17', 'Salvador', 'Salvador', 'Bahia', 'Brasil', -12.9714, -38.5014, 'Music', '#EF4444', true, 'yearly', 98),
('Carnaval de Recife/Olinda', 'Carnaval tradicional com frevo', 'local', 'festival', '2026-02-14', '2026-02-17', 'Recife/Olinda', 'Recife', 'Pernambuco', 'Brasil', -8.0476, -34.8770, 'Music', '#F59E0B', true, 'yearly', 97),
('São João de Campina Grande', 'Maior São João do Mundo', 'local', 'cultural', '2026-06-01', '2026-06-30', 'Campina Grande', 'Campina Grande', 'Paraíba', 'Brasil', -7.2306, -35.8811, 'Flame', '#F59E0B', true, 'yearly', 95),

-- Eventos Locais - Centro-Oeste
('Festival de Inverno de Bonito', 'Festival cultural em meio à natureza', 'local', 'cultural', '2026-07-01', '2026-07-31', 'Bonito', 'Bonito', 'Mato Grosso do Sul', 'Brasil', -21.1278, -56.4811, 'Mountain', '#10B981', true, 'yearly', 80),

-- Eventos Locais - Sudeste
('Réveillon de Copacabana', 'Maior festa de réveillon do Brasil', 'local', 'festival', '2025-12-31', '2026-01-01', 'Rio de Janeiro', 'Rio de Janeiro', 'Rio de Janeiro', 'Brasil', -22.9706, -43.1825, 'Sparkles', '#FFD700', true, 'yearly', 98),
('Parada LGBT+ São Paulo', 'Maior parada do orgulho LGBT+ do mundo', 'local', 'cultural', '2026-06-07', '2026-06-07', 'São Paulo', 'São Paulo', 'São Paulo', 'Brasil', -23.5505, -46.6333, 'Rainbow', '#EC4899', true, 'yearly', 95),
('Virada Cultural SP', 'Festival cultural de 24 horas', 'local', 'cultural', '2026-05-16', '2026-05-17', 'São Paulo', 'São Paulo', 'São Paulo', 'Brasil', -23.5505, -46.6333, 'Music', '#8B5CF6', true, 'yearly', 90),

-- Eventos Locais - Sul
('Festa da Uva', 'Celebração da colheita da uva', 'local', 'festival', '2026-02-01', '2026-02-28', 'Caxias do Sul', 'Caxias do Sul', 'Rio Grande do Sul', 'Brasil', -29.1634, -51.1797, 'Grape', '#9333EA', true, 'yearly', 85),
('Festival de Cinema de Gramado', 'Principal festival de cinema latino', 'local', 'cultural', '2026-08-07', '2026-08-15', 'Gramado', 'Gramado', 'Rio Grande do Sul', 'Brasil', -29.3789, -50.8761, 'Film', '#EF4444', true, 'yearly', 85);

COMMENT ON TABLE public.events IS 'Tabela de eventos festivos, culturais e esportivos';
COMMENT ON TABLE public.saved_events IS 'Tabela de eventos salvos pelos usuários';
