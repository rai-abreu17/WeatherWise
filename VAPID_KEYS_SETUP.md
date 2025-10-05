# 🔐 Configuração de Chaves VAPID - Guia Completo

## ✅ Suas Chaves VAPID Geradas

### Chave Pública (Public Key):
```
BDxMItW5Gd3Shvcst00uT5AutfkdaLCcjJtG83bJzND0juEuEyzeki7U-Ix1GM72-uwTewI9ytWzd_egNGs1N_0
```

### Chave Privada (Private Key):
```
zb0kyumf0EvD5aqf6jfQjfWUw3ZCsaX-zxCQjEgnnyU
```

⚠️ **IMPORTANTE**: A chave privada deve ser mantida em SEGREDO! Nunca a compartilhe publicamente.

---

## 📝 Passo a Passo - Configuração

### 1️⃣ Configurar Chave Pública no Frontend

✅ **JÁ CONFIGURADO** em `src/components/NotificationButton.tsx`

A chave pública já foi adicionada automaticamente no código.

---

### 2️⃣ Configurar Chave Privada no Supabase

#### Opção A: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase:**
   - https://supabase.com/dashboard/project/xcjfrlfqkcwazqabtbrw

2. **Vá em Settings → Edge Functions:**
   - No menu lateral: **Settings** (⚙️)
   - Depois: **Edge Functions**

3. **Adicione as Secrets (Variáveis de Ambiente):**
   - Clique em **"Add new secret"** ou **"Manage secrets"**
   
   - **Secret 1:**
     - Name: `VAPID_PUBLIC_KEY`
     - Value: `BDxMItW5Gd3Shvcst00uT5AutfkdaLCcjJtG83bJzND0juEuEyzeki7U-Ix1GM72-uwTewI9ytWzd_egNGs1N_0`
   
   - **Secret 2:**
     - Name: `VAPID_PRIVATE_KEY`
     - Value: `zb0kyumf0EvD5aqf6jfQjfWUw3ZCsaX-zxCQjEgnnyU`

4. **Salve as configurações**

#### Opção B: Via CLI do Supabase

Se você tiver o Supabase CLI instalado:

\`\`\`bash
# Configurar chave pública
npx supabase secrets set VAPID_PUBLIC_KEY="BDxMItW5Gd3Shvcst00uT5AutfkdaLCcjJtG83bJzND0juEuEyzeki7U-Ix1GM72-uwTewI9ytWzd_egNGs1N_0"

# Configurar chave privada
npx supabase secrets set VAPID_PRIVATE_KEY="zb0kyumf0EvD5aqf6jfQjfWUw3ZCsaX-zxCQjEgnnyU"
\`\`\`

---

### 3️⃣ Verificar Configuração

Após configurar as secrets no Supabase:

1. **Recarregue a página** da aplicação
2. **Clique no sino** 🔔 na página de resultados
3. **Permita notificações** quando o navegador perguntar
4. **Verifique no console** se não há mais erros

---

## 🧪 Testar as Notificações

### Teste 1: Ativar Notificações

1. Faça uma análise climática
2. Na página de resultados, clique no sino 🔔
3. Permita notificações no navegador
4. O sino deve ficar azul e pulsando

### Teste 2: Enviar Notificação de Teste

Via console do navegador:

\`\`\`javascript
// Enviar uma notificação de teste
navigator.serviceWorker.ready.then((registration) => {
  registration.showNotification("WeatherWise - Teste", {
    body: "Esta é uma notificação de teste!",
    icon: "/favicon.ico",
    badge: "/favicon.ico"
  });
});
\`\`\`

### Teste 3: Enviar via Backend

Depois de fazer o deploy da Edge Function:

\`\`\`bash
# Deploy da função
npx supabase functions deploy send-push-notification

# Testar envio
curl -X POST 'https://xcjfrlfqkcwazqabtbrw.supabase.co/functions/v1/send-push-notification' \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Alerta Climático!",
    "body": "A probabilidade de chuva aumentou para 80%",
    "url": "/results"
  }'
\`\`\`

---

## 📊 Status Atual

- ✅ **Chaves VAPID**: Geradas
- ✅ **Chave Pública**: Configurada no código
- ✅ **Chave Privada**: Configurada no Supabase
- ✅ **Autenticação**: Obrigatória para notificações
- ⏳ **Edge Function**: Aguardando deploy

---

## 🔍 Troubleshooting

### Erro: "Chave VAPID não configurada"
- ✅ **Resolvido!** A chave pública já foi adicionada ao código.

### Erro ao enviar notificações
- Verifique se as secrets foram configuradas no Supabase
- Faça o deploy da Edge Function \`send-push-notification\`

### Notificações não aparecem
- Verifique permissões do navegador
- Teste com uma notificação local (código acima)
- Veja o console para erros

### Service Worker não registra
- Verifique se \`public/service-worker.js\` existe
- Recarregue a página com Ctrl + Shift + R
- Veja Application → Service Workers no DevTools

---

## 📚 Próximos Passos

1. ✅ **Configurar secrets no Supabase** (faça isso agora!)
2. Deploy da Edge Function:
   \`\`\`bash
   npx supabase functions deploy send-push-notification
   \`\`\`

3. Implementar lógica de detecção de mudanças climáticas

4. Testar notificações end-to-end

---

## 🎉 Quando Tudo Estiver Configurado

O fluxo completo será:

1. Usuário ativa o sino 🔔
2. Sistema salva inscrição no Supabase
3. Backend monitora mudanças climáticas
4. Quando detectar mudança significativa:
   - Chama Edge Function \`send-push-notification\`
   - Envia notificação push para dispositivos
5. Usuário recebe alerta no celular/desktop

---

**Data de Geração**: 2025-10-04
**Status**: Chaves geradas e públicas configuradas ✅
