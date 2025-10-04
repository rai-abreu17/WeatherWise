# 📜 Como Criar a Tabela query_history no Supabase

## 📋 O que é?

A tabela `query_history` armazena o histórico de consultas climáticas que cada usuário faz, permitindo:
- ✅ Ver consultas anteriores
- ✅ Re-executar consultas rapidamente
- ✅ Deletar histórico

---

## 🚀 Criar a Tabela no Supabase

### **Via Dashboard do Supabase**

1. **Acesse:** https://supabase.com/dashboard/project/xcjfrlfqkcwazqabtbrw/sql

2. **Clique em:** "+ New query"

3. **Cole este SQL:**

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

4. **Execute:** Clique em "Run" ou `Ctrl + Enter`

5. **Sucesso!** ✅ Você deve ver "Success. No rows returned"

---

## 📊 Estrutura da Tabela

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único da consulta |
| `user_id` | UUID | ID do usuário (referência a auth.users) |
| `location_name` | TEXT | Nome da localização consultada |
| `latitude` | DECIMAL | Latitude da localização |
| `longitude` | DECIMAL | Longitude da localização |
| `query_date` | DATE | Data do evento consultado |
| `created_at` | TIMESTAMP | Quando a consulta foi feita |

---

## 🔐 Segurança (RLS)

- ✅ Usuários só veem seu próprio histórico
- ✅ Usuários só podem adicionar ao seu próprio histórico
- ✅ Usuários só podem deletar seu próprio histórico
- ✅ Se usuário for deletado, seu histórico também é

---

## 🎯 Como Usar

### **Funcionalidade Automática! ✅**

O histórico já está completamente integrado e funcionará automaticamente:

1. **Salvamento Automático:**
   - Toda vez que você fizer uma análise climática, ela será salva automaticamente no histórico
   - Apenas usuários logados terão histórico salvo

2. **Visualização:**
   - Na página inicial (Index), role até o final
   - Se estiver logado, verá a seção "Histórico de Consultas"
   - Mostra todas as consultas anteriores em ordem cronológica (mais recente primeiro)

3. **Ações Disponíveis:**
   - **Re-consultar:** Volta para o formulário com os dados pré-preenchidos
   - **Deletar:** Remove a consulta do histórico

---

## ✅ Checklist de Implementação

- [ ] **Executar SQL no dashboard do Supabase** (IMPORTANTE - faça isso agora!)
- [x] **Integração já feita** - saveQueryToHistory está automaticamente no Index.tsx
- [x] **QueryHistoryList já adicionado** - Aparece automaticamente para usuários logados
- [ ] **Testar:** Faça login, execute uma análise, veja o histórico aparecer no final da página

---

**Execute o SQL agora para habilitar o histórico de consultas!** 🚀
