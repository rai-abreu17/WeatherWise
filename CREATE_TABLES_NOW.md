# 🚀 Criar Tabelas no Supabase - Passo a Passo

## 📍 Projeto Atual
**Project ID:** `sljqdfepgkrkpkmzucff`  
**URL:** https://supabase.com/dashboard/project/sljqdfepgkrkpkmzucff

---

## ✅ Opção 1: SQL Editor (Mais Rápido)

1. **Acesse o SQL Editor:**
   https://supabase.com/dashboard/project/sljqdfepgkrkpkmzucff/sql

2. **Execute os 2 scripts abaixo (um de cada vez):**

### Script 1: Tabela `query_history`

```sql
-- Tabela para armazenar histórico de consultas dos usuários
CREATE TABLE public.query_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  query_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own query history." ON public.query_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query history." ON public.query_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own query history." ON public.query_history
  FOR DELETE USING (auth.uid() = user_id);

-- Índice para melhorar performance de buscas
CREATE INDEX idx_query_history_user_id ON public.query_history(user_id);
CREATE INDEX idx_query_history_created_at ON public.query_history(created_at DESC);
```

### Script 2: Tabela `push_subscriptions`

```sql
-- Tabela para armazenar inscrições de notificações push
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL, -- Armazena o objeto PushSubscription
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own subscriptions." ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions." ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions." ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
```

---

## ✅ Opção 2: Via Command Line (Se souber a senha do DB)

```bash
npx supabase db push
```

Vai pedir a senha do banco de dados (você encontra em: Database Settings → Connection String)

---

## 🔍 Verificar se foi criado

Após executar, execute este comando para verificar:

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

Se funcionou, o arquivo `types.ts` terá as definições das tabelas `query_history` e `push_subscriptions`.

---

## 📊 O que cada tabela faz:

### `query_history`
- Armazena histórico de consultas climáticas do usuário
- Cada usuário só vê suas próprias consultas (RLS habilitado)
- Campos: localização, coordenadas, data da consulta

### `push_subscriptions`
- Armazena inscrições para notificações push
- Permite enviar notificações para os usuários
- Cada usuário só gerencia suas próprias inscrições

---

## ⚡ Próximos passos após criar as tabelas:

1. Execute: `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`
2. Reinicie o dev server (Ctrl+C e depois `npm run dev`)
3. Teste a aplicação - todos os erros de tipos devem desaparecer! ✅
