-- ============================================
-- OTIMIZAÇÕES DE PERFORMANCE - ÍNDICES
-- ============================================
-- Data: 2025-10-05
-- Objetivo: Reduzir tempo de análise de 10-15s para < 3s
-- ============================================

-- 1. Índice composto para localizações (geocoding rápido)
CREATE INDEX IF NOT EXISTS idx_locations_name_lower 
ON locations(LOWER(name));

CREATE INDEX IF NOT EXISTS idx_locations_city_lower 
ON locations(LOWER(city));

-- Índice para coordenadas (busca geográfica)
CREATE INDEX IF NOT EXISTS idx_locations_coordinates 
ON locations(latitude, longitude);

-- 2. Índice para contagem de queries (cidades populares)
CREATE INDEX IF NOT EXISTS idx_locations_query_count 
ON locations(query_count DESC NULLS LAST);

-- 3. Índice para push subscriptions (notificações rápidas) - apenas se a tabela existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
    ON push_subscriptions(user_id, is_active);
    
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_location 
    ON push_subscriptions(location_name, is_active);
  END IF;
END $$;

-- 4. Índice para histórico de queries (queries recentes) - apenas se a tabela existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_history') THEN
    CREATE INDEX IF NOT EXISTS idx_query_history_user_recent 
    ON query_history(user_id, created_at DESC)
    WHERE created_at > NOW() - INTERVAL '30 days';

    CREATE INDEX IF NOT EXISTS idx_query_history_location_recent 
    ON query_history(location_name, created_at DESC)
    WHERE created_at > NOW() - INTERVAL '30 days';
  END IF;
END $$;

-- 5. Índice para cache de feriados (busca rápida)
CREATE INDEX IF NOT EXISTS idx_holidays_cache_lookup 
ON holidays_cache(country_code, year, holiday_date);

-- Nota: Não podemos usar CURRENT_DATE em índices parciais (não é IMMUTABLE)
-- Índice completo para holidays_cache
CREATE INDEX IF NOT EXISTS idx_holidays_cache_date 
ON holidays_cache(country_code, holiday_date);

-- 6. Adicionar coluna de estatísticas de performance (opcional)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_history') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'query_history' 
      AND column_name = 'performance_metrics'
    ) THEN
      ALTER TABLE query_history 
      ADD COLUMN performance_metrics JSONB;
      
      COMMENT ON COLUMN query_history.performance_metrics IS 
      'Métricas de performance da análise (geocoding, NASA API, cálculos, etc)';
    END IF;
    
    -- Índice GIN para busca em JSONB
    CREATE INDEX IF NOT EXISTS idx_query_history_performance 
    ON query_history USING GIN (performance_metrics);
  END IF;
END $$;

-- 7. Função para limpar queries antigas (manutenção) - apenas se a tabela existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_history') THEN
    CREATE OR REPLACE FUNCTION clean_old_queries()
    RETURNS INTEGER AS $func$
    DECLARE
      deleted_count INTEGER;
    BEGIN
      -- Deletar queries com mais de 90 dias (manter apenas 3 meses)
      DELETE FROM query_history 
      WHERE created_at < NOW() - INTERVAL '90 days';
      
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
      RETURN deleted_count;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- 8. Atualizar contador de queries nas localizações - apenas se as tabelas existirem
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_history') 
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    
    CREATE OR REPLACE FUNCTION increment_location_query_count()
    RETURNS TRIGGER AS $func$
    BEGIN
      UPDATE locations 
      SET query_count = COALESCE(query_count, 0) + 1,
          last_queried = NOW()
      WHERE id = NEW.location_id;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Trigger para incrementar automaticamente
    DROP TRIGGER IF EXISTS trigger_increment_query_count ON query_history;
    CREATE TRIGGER trigger_increment_query_count
      AFTER INSERT ON query_history
      FOR EACH ROW
      EXECUTE FUNCTION increment_location_query_count();
  END IF;
END $$;

-- 9. Analyze para otimizar índices existentes (VACUUM removido - não funciona em migrations)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    EXECUTE 'ANALYZE locations';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_history') THEN
    EXECUTE 'ANALYZE query_history';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
    EXECUTE 'ANALYZE push_subscriptions';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holidays_cache') THEN
    EXECUTE 'ANALYZE holidays_cache';
  END IF;
END $$;

-- 10. Comentários para documentação
COMMENT ON INDEX idx_locations_name_lower IS 
'Índice para geocoding rápido por nome de localização (case-insensitive)';

COMMENT ON INDEX idx_locations_query_count IS 
'Índice para identificar cidades mais consultadas (pré-carregamento)';

-- Comentários condicionais (apenas se os índices existirem)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_query_history_user_recent') THEN
    COMMENT ON INDEX idx_query_history_user_recent IS 
    'Índice parcial para queries recentes (últimos 30 dias)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_holidays_cache_date') THEN
    COMMENT ON INDEX idx_holidays_cache_lookup IS 
    'Índice para busca rápida de feriados por país, ano e data';
    
    COMMENT ON INDEX idx_holidays_cache_date IS 
    'Índice para busca de feriados futuros por país e data';
  END IF;
END $$;

-- ============================================
-- ESTATÍSTICAS DE PERFORMANCE
-- ============================================

-- View para monitorar performance - apenas se a tabela existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_history') THEN
    EXECUTE '
    CREATE OR REPLACE VIEW performance_stats AS
    SELECT 
      DATE(created_at) as query_date,
      COUNT(*) as total_queries,
      AVG((performance_metrics->>''total'')::numeric) as avg_total_time_ms,
      AVG((performance_metrics->>''fetchHistoricalData'')::numeric) as avg_nasa_time_ms,
      AVG((performance_metrics->>''parallelRequests'')::numeric) as avg_parallel_time_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (performance_metrics->>''total'')::numeric) as p95_total_time_ms
    FROM query_history
    WHERE performance_metrics IS NOT NULL
      AND created_at > NOW() - INTERVAL ''7 days''
    GROUP BY DATE(created_at)
    ORDER BY query_date DESC
    ';
    
    COMMENT ON VIEW performance_stats IS 
    'Estatísticas de performance das análises climáticas (últimos 7 dias)';
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO DE ÍNDICES
-- ============================================
-- Execute manualmente após aplicar a migração:
-- 
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('locations', 'query_history', 'push_subscriptions', 'holidays_cache')
-- ORDER BY tablename, indexname;

-- ============================================
-- SCRIPT DE MANUTENÇÃO (executar manualmente quando necessário)
-- ============================================
-- 
-- -- Limpar queries antigas
-- SELECT clean_old_queries() as queries_deleted;
-- 
-- -- Atualizar estatísticas
-- ANALYZE locations;
-- ANALYZE query_history;
-- ANALYZE holidays_cache;
--
-- -- Verificar tamanho dos índices
-- SELECT schemaname, tablename, indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;
