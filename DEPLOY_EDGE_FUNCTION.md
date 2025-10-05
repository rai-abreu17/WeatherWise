# 🚀 Como Fazer Deploy da Edge Function Atualizada

## ⚠️ Situação Atual

A Edge Function foi atualizada localmente para processar múltiplas localizações, mas o **deploy falhou** porque o projeto Supabase está **INACTIVE** (inativo).

## 📋 Passos para Ativar e Fazer Deploy

### 1️⃣ Ativar o Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto: `izoausphjrxzcozumiwt`
4. Se estiver pausado/inativo, clique em **"Resume Project"** ou **"Unpause"**
5. Aguarde alguns minutos até ficar **ACTIVE** (verde)

### 2️⃣ Fazer Deploy da Edge Function

Após o projeto estar ativo, execute no terminal:

```bash
npx supabase functions deploy climate-analysis
```

**Ou, se tiver o Supabase CLI instalado globalmente:**

```bash
supabase functions deploy climate-analysis
```

### 3️⃣ Verificar o Deploy

Após o deploy com sucesso, você verá:

```
✅ Deployed Function climate-analysis to project izoausphjrxzcozumiwt
```

### 4️⃣ Testar a Função

1. Volte para sua aplicação
2. Adicione 1 ou mais localizações
3. Clique em "Analisar Probabilidades Climáticas"
4. ✅ Deve funcionar!

---

## 🔍 Verificar Status do Projeto

### Via Dashboard
- Vá em: https://supabase.com/dashboard/project/izoausphjrxzcozumiwt
- Veja o status no topo (deve estar **ACTIVE**)

### Via CLI
```bash
npx supabase projects list
```

---

## 🛠️ Solução de Problemas

### Erro: "Docker is not running"
**Solução:** Ignore este aviso. O deploy ainda funciona via cloud.

### Erro: "INACTIVE"
**Solução:** Ative o projeto no dashboard (passo 1)

### Erro: "Authentication failed"
**Solução:** Faça login novamente:
```bash
npx supabase login
```

### Erro: "Project not found"
**Solução:** Link o projeto:
```bash
npx supabase link --project-ref izoausphjrxzcozumiwt
```

---

## 📊 O Que Foi Alterado na Edge Function?

### ✅ Antes (Single Location)
```typescript
{
  "location": "São Paulo",
  "date": "2025-12-25",
  ...
}
```

### ✅ Agora (Single ou Multiple)
```typescript
{
  "locations": [
    { "name": "São Paulo", "latitude": -23.5505, "longitude": -46.6333 },
    { "name": "Rio de Janeiro", "latitude": -22.9068, "longitude": -43.1729 }
  ],
  "date": "2025-12-25",
  ...
}
```

### 🔄 Compatibilidade
A Edge Function ainda aceita o formato antigo (`"location": "string"`), então análises únicas continuam funcionando!

### 🚀 Performance
As localizações são processadas em **paralelo** usando `Promise.all()`, então é rápido!

---

## 📝 Comandos Úteis

### Ver logs em tempo real
```bash
npx supabase functions logs climate-analysis --tail
```

### Ver logs recentes
```bash
npx supabase functions logs climate-analysis --limit 50
```

### Testar localmente (requer Docker)
```bash
npx supabase functions serve climate-analysis
```

---

## ✅ Checklist de Deploy

- [ ] Projeto está **ACTIVE** no dashboard
- [ ] Executou: `npx supabase functions deploy climate-analysis`
- [ ] Viu mensagem de sucesso
- [ ] Testou na aplicação com 1 localização
- [ ] Testou na aplicação com 2+ localizações
- [ ] Viu comparação com tabs e troféu 🏆

---

## 🎯 Após o Deploy

### Teste Rápido
1. **1 Localização:**
   - Adicione "São Paulo"
   - Analise
   - ✅ Deve ver tela normal (sem tabs)

2. **Múltiplas Localizações:**
   - Adicione "São Paulo", "Rio de Janeiro", "Brasília"
   - Analise
   - ✅ Deve ver tabs e troféu na melhor

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs: `npx supabase functions logs climate-analysis`
2. Verifique o console do navegador (F12)
3. Verifique o Network tab (F12 → Network)

**Erro comum:** Se der erro 404, o projeto pode ainda estar ativando. Aguarde 2-3 minutos.

---

**Criado em:** Outubro 2025  
**Última atualização:** Deploy pendente (aguardando ativação do projeto)
