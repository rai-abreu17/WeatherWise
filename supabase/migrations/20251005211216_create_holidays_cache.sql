-- Tabela para cache de feriados da API Nager.Date
CREATE TABLE IF NOT EXISTS holidays_cache (
    id BIGSERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    holiday_date DATE NOT NULL,
    local_name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    is_global BOOLEAN DEFAULT true,
    holiday_types TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_holiday UNIQUE (country_code, holiday_date, local_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays_cache(country_code, holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays_cache(country_code, year);

-- Habilitar RLS
ALTER TABLE holidays_cache ENABLE ROW LEVEL SECURITY;

-- Policy de leitura pública
CREATE POLICY "Public read access to holidays" 
    ON holidays_cache FOR SELECT 
    USING (true);

-- Policy de escrita apenas para authenticated users (Edge Functions)
CREATE POLICY "Service role can insert holidays" 
    ON holidays_cache FOR INSERT 
    WITH CHECK (true);

-- Comentários
COMMENT ON TABLE holidays_cache IS 'Cache de feriados e datas comemorativas da API Nager.Date';
COMMENT ON COLUMN holidays_cache.country_code IS 'Código ISO do país (ex: BR para Brasil)';
COMMENT ON COLUMN holidays_cache.year IS 'Ano do feriado';
COMMENT ON COLUMN holidays_cache.holiday_date IS 'Data do feriado';
COMMENT ON COLUMN holidays_cache.local_name IS 'Nome do feriado em português';
COMMENT ON COLUMN holidays_cache.name_en IS 'Nome do feriado em inglês';
COMMENT ON COLUMN holidays_cache.is_global IS 'Se é feriado nacional ou apenas regional';
COMMENT ON COLUMN holidays_cache.holiday_types IS 'Tipos do feriado (Public, Bank, School, etc)';
