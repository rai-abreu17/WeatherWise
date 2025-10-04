# 🗄️ Como Criar a Tabela push_subscriptions no Supabase

## ⚠️ Erro Atual
```
Could not find the table 'public.push_subscriptions' in the schema cache
```

Isso significa que a tabela ainda não foi criada no banco de dados.

---

## 🚀 Solução: Executar Migration

### **Opção 1: Via Dashboard do Supabase (Mais Fácil)**

1. **Acesse:** https://supabase.com/dashboard/project/xcjfrlfqkcwazqabtbrw

2. **Vá em SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"** (ícone 📝)

3. **Crie uma New Query:**
   - Clique em **"+ New query"**

4. **Cole este SQL:**

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

5. **Execute:**
   - Clique em **"Run"** (ou pressione `Ctrl + Enter`)
   - Deve aparecer "Success. No rows returned"

6. **Verifique:**
   - Vá em **"Table Editor"** no menu lateral
   - Você deve ver a tabela `push_subscriptions` criada

---

### **Opção 2: Via Supabase CLI** ⚠️

> **Nota:** A CLI requer plano pago do Supabase para aplicar migrations remotamente.  
> **Recomendamos usar a Opção 1 (Dashboard)** que funciona em todos os planos.

Se você tiver um plano pago:

```powershell
# Fazer login
npx supabase login

# Vincular projeto
npx supabase link --project-ref xcjfrlfqkcwazqabtbrw

# Aplicar migrations
npx supabase db push
```

---

## ✅ Verificar se Funcionou

Após criar a tabela:

1. **Recarregue a aplicação** no navegador
2. **Faça login** (se ainda não estiver logado)
3. **Faça uma análise climática**
4. **Na página de resultados**, clique no sino 🔔
5. **Permita notificações** quando o navegador pedir
6. **Verifique o console** - não deve mais aparecer o erro

---

## 🔍 Estrutura da Tabela Criada

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único da inscrição |
| `user_id` | UUID | ID do usuário (referência a auth.users) |
| `subscription` | JSONB | Dados da inscrição push (endpoint, keys, etc) |
| `created_at` | TIMESTAMP | Data de criação |

### 🔐 Segurança (RLS - Row Level Security)

A tabela tem políticas que garantem que:
- ✅ Usuários só veem suas próprias inscrições
- ✅ Usuários só podem criar inscrições para si mesmos
- ✅ Usuários só podem deletar suas próprias inscrições
- ✅ Se o usuário for deletado, suas inscrições também são

---

## 📊 Após Criar a Tabela

O fluxo completo funcionará:

1. ✅ Usuário faz login
2. ✅ Usuário ativa o sino 🔔
3. ✅ Sistema salva no Supabase com `user_id`
4. ✅ Backend pode buscar todas as inscrições para enviar notificações

---

**Importante:** Execute o SQL no dashboard do Supabase **AGORA** para resolver o erro! 🎯
