# 🗄️ Criar TODAS as Tabelas no Supabase - Guia Completo

## ⚠️ IMPORTANTE

Você precisa criar **2 tabelas** no Supabase para o app funcionar completamente:

1. ✅ `push_subscriptions` - Para notificações push
2. ✅ `query_history` - Para histórico de consultas

---

## 🚀 Como Criar as Tabelas

### **Via Dashboard do Supabase (Recomendado)**

1. **Acesse:** https://supabase.com/dashboard/project/xcjfrlfqkcwazqabtbrw/sql

2. **Clique em:** "+ New query"

3. **Cole TODO este SQL de uma vez:**

```sql
-- ========================================
-- TABELA 1: push_subscriptions
-- Para salvar inscrições de notificações push
-- ========================================

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions." ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions." ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions." ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);


-- ========================================
-- TABELA 2: query_history
-- Para histórico de consultas climáticas
-- ========================================

CREATE TABLE public.query_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  query_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own query history." ON public.query_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query history." ON public.query_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own query history." ON public.query_history
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para melhorar performance
CREATE INDEX idx_query_history_user_id ON public.query_history(user_id);
CREATE INDEX idx_query_history_created_at ON public.query_history(created_at DESC);
```

4. **Execute:** Clique em "Run" ou pressione `Ctrl + Enter`

5. **Sucesso!** ✅ Você deve ver "Success. No rows returned"

---

## ✅ Verificar se as Tabelas Foram Criadas

1. **Vá em:** Table Editor (menu lateral)
2. **Você deve ver:**
   - ✅ `push_subscriptions` (2 colunas: id, user_id, subscription, created_at)
   - ✅ `query_history` (7 colunas: id, user_id, location_name, latitude, longitude, query_date, created_at)

---

## 📊 Estrutura das Tabelas

### **push_subscriptions**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Referência ao usuário |
| subscription | JSONB | Dados da inscrição push (endpoint, keys) |
| created_at | TIMESTAMP | Data de criação |

**Uso:** Armazena inscrições de push notifications para enviar alertas climáticos.

---

### **query_history**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Referência ao usuário |
| location_name | TEXT | Nome da localização |
| latitude | DOUBLE PRECISION | Latitude |
| longitude | DOUBLE PRECISION | Longitude |
| query_date | DATE | Data do evento consultado |
| created_at | TIMESTAMP | Quando foi consultado |

**Uso:** Salva histórico de consultas para re-executar análises rapidamente.

---

## 🔐 Segurança (RLS - Row Level Security)

Ambas as tabelas têm políticas de segurança que garantem:

- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só podem criar seus próprios registros
- ✅ Usuários só podem deletar seus próprios registros
- ✅ Se usuário for deletado, seus dados também são

---

## 🎯 O Que Acontece Após Criar as Tabelas

### **1. Notificações Push Funcionarão:**
- Botão do sino (🔔) na página Results ficará funcional
- Usuários poderão ativar/desativar alertas climáticos
- Sistema salvará inscrições no Supabase

### **2. Histórico de Consultas Funcionará:**
- Seção "Histórico de Consultas" aparecerá na página inicial
- Toda análise será automaticamente salva no histórico
- Usuários poderão re-executar consultas anteriores rapidamente

---

## ⚡ Testar Após Criar as Tabelas

### **Teste 1: Notificações**
1. Faça login na aplicação
2. Execute uma análise climática
3. Na página Results, clique no sino 🔔
4. Permita notificações quando o navegador pedir
5. Verifique em Table Editor → push_subscriptions se foi criado um registro

### **Teste 2: Histórico**
1. Faça login na aplicação
2. Execute 2-3 análises climáticas diferentes
3. Volte para a página inicial
4. Role até o final - você verá "Histórico de Consultas"
5. Verifique que todas as consultas estão listadas
6. Teste os botões "Re-consultar" e deletar (🗑️)

---

## 🚨 Erros Comuns

### Erro: "Could not find the table 'public.push_subscriptions'"
- **Solução:** A tabela não foi criada. Execute o SQL acima.

### Erro: "Could not find the table 'public.query_history'"
- **Solução:** A tabela não foi criada. Execute o SQL acima.

### Erro: "new row violates row-level security policy"
- **Solução:** Certifique-se de estar logado na aplicação. RLS só permite operações do próprio usuário.

---

## 📚 Recursos Adicionais

- **Guia Detalhado de Notificações:** `VAPID_KEYS_SETUP.md`
- **Guia Detalhado de Histórico:** `QUERY_HISTORY_GUIDE.md`
- **Criar Tabela push_subscriptions:** `CREATE_TABLE_GUIDE.md`

---

**Execute o SQL AGORA para habilitar todas as funcionalidades!** 🚀

**Data de Criação:** 2025-10-04  
**Status:** Pronto para execução ✅
