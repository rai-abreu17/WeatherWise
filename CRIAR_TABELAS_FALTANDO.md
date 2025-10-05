# ⚠️ IMPORTANTE: Tabelas Faltando!

## 🔴 Problema Identificado

As tabelas `query_history` e `push_subscriptions` **NÃO existem** no banco de dados `sljqdfepgkrkpkmzucff`.

O banco tem outras tabelas (api_cache, comparison_sessions, locations, etc.) mas não tem as que o código precisa.

---

## ✅ SOLUÇÃO RÁPIDA - Execute Agora:

### Passo 1: Acesse o SQL Editor
🔗 https://supabase.com/dashboard/project/sljqdfepgkrkpkmzucff/sql/new

### Passo 2: Execute estes 2 scripts

**SCRIPT 1 - Criar tabela query_history:**

```sql
-- Tabela para armazenar histórico de consultas dos usuários
CREATE TABLE IF NOT EXISTS public.query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  query_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own query history" 
  ON public.query_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query history" 
  ON public.query_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own query history" 
  ON public.query_history FOR DELETE 
  USING (auth.uid() = user_id);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_query_history_user_id 
  ON public.query_history(user_id);
  
CREATE INDEX IF NOT EXISTS idx_query_history_created_at 
  ON public.query_history(created_at DESC);
```

**SCRIPT 2 - Criar tabela push_subscriptions:**

```sql
-- Tabela para armazenar inscrições de notificações push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own subscriptions" 
  ON public.push_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
  ON public.push_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
  ON public.push_subscriptions(user_id);
```

### Passo 3: Depois de executar, rode este comando:

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## 📊 Status Atual

- ❌ query_history: NÃO existe
- ❌ push_subscriptions: NÃO existe
- ✅ api_cache: existe
- ✅ comparison_sessions: existe
- ✅ locations: existe
- ✅ weather_queries: existe

---

## ⚡ Por que os erros acontecem?

O código TypeScript está tentando usar `supabase.from("query_history")` e `supabase.from("push_subscriptions")`, mas essas tabelas não existem no schema do banco.

Depois de criar as tabelas, os tipos serão gerados automaticamente e todos os erros vão desaparecer! 🎯
