# 🔍 Diagnóstico: Por Que o Deploy Falhou?

## 🚨 Problema Identificado

```
ERROR: Cannot retrieve service for project izoausphjrxzcozumiwt 
with current status 'INACTIVE'
```

### ❌ O Que Isso Significa?

Seu projeto Supabase está **PAUSADO** ou **INATIVO**. Isso acontece quando:
- O projeto ficou inativo por muito tempo
- Você está no plano gratuito e pausou o projeto
- O projeto atingiu algum limite

## ✅ SOLUÇÃO IMEDIATA

### Opção 1: Ativar o Projeto (Recomendado)

1. **Abra o Dashboard:**
   - https://supabase.com/dashboard/project/izoausphjrxzcozumiwt

2. **Procure o Botão:**
   - "Resume Project" ou "Unpause Project" ou "Activate"

3. **Clique e Aguarde:**
   - Pode levar 2-5 minutos para ativar

4. **Após Ativar, Faça o Deploy:**
   ```bash
   npx supabase functions deploy climate-analysis
   ```

### Opção 2: Testar com 1 Localização Apenas (Temporário)

Enquanto o projeto está pausado, você pode testar com **apenas 1 localização**:

1. Na interface, adicione **APENAS 1** localização
2. Não adicione mais de uma
3. Clique em "Analisar"
4. ✅ Deve funcionar (usa formato antigo que a Edge Function antiga entende)

**Por quê funciona?**
- Com 1 localização: Frontend envia formato antigo compatível
- Com 2+: Frontend envia novo formato que Edge Function antiga não entende

### Opção 3: Criar Novo Projeto (Se Não Conseguir Ativar)

Se não conseguir ativar o projeto:

1. Crie um novo projeto em: https://supabase.com/dashboard
2. Copie a URL e API Keys
3. Atualize o arquivo `.env` ou `src/integrations/supabase/client.ts`
4. Faça o deploy: `npx supabase functions deploy climate-analysis`

## 🔧 Verificar Status do Projeto

### Via CLI
```bash
npx supabase projects list
```

Procure por: `izoausphjrxzcozumiwt`
- **Status: ACTIVE** ✅ = Pode fazer deploy
- **Status: INACTIVE** ❌ = Precisa ativar primeiro

### Via Dashboard
https://supabase.com/dashboard

Você verá um banner se o projeto estiver pausado.

## 📊 Fluxo de Ativação

```
1. Projeto INACTIVE
   ↓
2. Clicar "Resume"
   ↓
3. Aguardar 2-5 minutos
   ↓
4. Status vira ACTIVE
   ↓
5. Deploy funciona
```

## 🎯 Após Ativar

1. **Fazer Deploy:**
   ```bash
   npx supabase functions deploy climate-analysis
   ```

2. **Verificar Sucesso:**
   ```
   ✅ Deployed Function climate-analysis to project izoausphjrxzcozumiwt
   ```

3. **Testar Múltiplas Localizações:**
   - Adicione "São Paulo", "Rio de Janeiro", "Brasília"
   - Clique em "Analisar"
   - ✅ Deve ver tabs e comparação

## ⚠️ Importante

**NÃO TENTE:**
- ❌ Fazer deploy com projeto INACTIVE (vai falhar)
- ❌ Múltiplas localizações sem deploy (vai dar erro)

**PODE FAZER:**
- ✅ Testar com 1 localização (formato antigo compatível)
- ✅ Explorar a interface
- ✅ Adicionar/remover localizações

## 🆘 Troubleshooting

### "Não consigo ativar o projeto"
- Verifique se você está logado na conta correta
- Verifique se não excedeu o limite do plano gratuito
- Entre em contato com suporte Supabase

### "Deploy deu timeout"
- Aguarde alguns minutos após ativar
- Tente novamente

### "Authentication failed"
```bash
npx supabase login
```

## 📞 Links Úteis

- **Dashboard:** https://supabase.com/dashboard
- **Seu Projeto:** https://supabase.com/dashboard/project/izoausphjrxzcozumiwt
- **Docs:** https://supabase.com/docs/guides/functions
- **Suporte:** https://supabase.com/support

---

## ✅ Checklist

- [ ] Projeto está ACTIVE no dashboard
- [ ] Executou `npx supabase functions deploy climate-analysis`
- [ ] Viu mensagem de sucesso
- [ ] Testou com múltiplas localizações
- [ ] Funciona! 🎉

---

**Criado:** Outubro 2025  
**Status Atual:** Aguardando ativação do projeto
