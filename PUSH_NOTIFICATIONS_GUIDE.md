# 🔔 Guia de Implementação - Notificações Push

## ✅ Implementação Concluída

### Arquivos Criados:

1. **`src/services/pushNotifications.ts`**
   - Funções para gerenciar inscrições no Supabase
   - `savePushSubscription()` - Salva inscrição
   - `deletePushSubscription()` - Remove inscrição
   - `getPushSubscriptions()` - Lista inscrições

2. **`src/components/PushNotificationToggle.tsx`**
   - Componente React com switch para ativar/desativar
   - Solicita permissão do navegador
   - Gerencia inscrições de push

3. **`public/service-worker.js`**
   - Service Worker para receber notificações
   - Exibe notificações push
   - Gerencia cliques nas notificações

4. **`supabase/migrations/create_push_subscriptions.sql`**
   - Schema da tabela `push_subscriptions`
   - Políticas RLS (Row Level Security)

## 🔧 Configuração Necessária

### 1. Criar Tabela no Supabase

Execute o SQL no Supabase Dashboard:

\`\`\`sql
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
\`\`\`

### 2. Gerar Chaves VAPID

1. Acesse: https://web-push-codelab.glitch.me/
2. Clique em "Generate Keys"
3. **Copie a Public Key** e cole em `src/components/PushNotificationToggle.tsx`:
   \`\`\`typescript
   const VAPID_PUBLIC_KEY = "SUA_CHAVE_PUBLICA_AQUI";
   \`\`\`
4. **Salve a Private Key** para usar no backend

### 3. Configurar Variáveis de Ambiente no Supabase

No Dashboard do Supabase (Settings → Edge Functions):

\`\`\`
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
\`\`\`

## 🎯 Como Funciona

### Fluxo do Usuário:

1. **Usuário faz login**
2. **Toggle aparece** na página inicial
3. **Usuário ativa** as notificações
4. **Navegador pede permissão**
5. **Inscrição salva** no Supabase
6. **Backend detecta mudanças** climáticas
7. **Notificação enviada** via Push API

### Componente na Interface:

\`\`\`tsx
{isLoggedIn && (
  <PushNotificationToggle />
)}
\`\`\`

O componente mostra:
- 🔔 Ícone de sino
- Toggle switch
- Descrição da funcionalidade
- Status (ativado/desativado)

## 📱 Backend para Enviar Notificações

### Edge Function do Supabase

Crie: `supabase/functions/send-push-notification/index.ts`

\`\`\`typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

webpush.setVapidDetails(
  "mailto:seu-email@example.com",
  VAPID_PUBLIC_KEY!,
  VAPID_PRIVATE_KEY!
);

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { title, body, url } = await req.json();

  // Buscar todas as inscrições ativas
  const { data: subscriptions } = await supabaseClient
    .from("push_subscriptions")
    .select("subscription");

  const notificationPayload = JSON.stringify({
    title: title || "Alerta Climático",
    body: body || "Mudança detectada nas condições climáticas",
    icon: "/favicon.ico",
    url: url || "/results",
  });

  const pushPromises = subscriptions?.map((sub: any) =>
    webpush.sendNotification(sub.subscription, notificationPayload)
      .catch((err) => console.error("Erro ao enviar push:", err))
  ) || [];

  await Promise.all(pushPromises);

  return new Response("Notificações enviadas!", { status: 200 });
});
\`\`\`

### Deploy da Edge Function:

\`\`\`bash
npx supabase functions deploy send-push-notification
\`\`\`

## 🧪 Teste Local

### 1. Testar Notificação Manual

No console do navegador (após ativar):

\`\`\`javascript
// Enviar notificação de teste
navigator.serviceWorker.ready.then((registration) => {
  registration.showNotification("Teste", {
    body: "Esta é uma notificação de teste!",
    icon: "/favicon.ico"
  });
});
\`\`\`

### 2. Verificar Service Worker

1. Abra DevTools → Application → Service Workers
2. Verifique se está "activated and running"
3. Teste com "Push" no DevTools

## 🚀 Integração Completa

### Quando Enviar Notificações?

1. **Mudança Significativa** no clima
   - ICP cai mais de 20 pontos
   - Probabilidade de chuva aumenta >30%
   
2. **Eventos Extremos** detectados
   - Alerta de tempestade
   - Temperatura extrema

3. **Datas Alternativas** melhores
   - Nova data com ICP muito superior

### Exemplo de Disparo:

\`\`\`typescript
// Quando detectar mudança significativa
const sendWeatherAlert = async () => {
  await supabase.functions.invoke('send-push-notification', {
    body: {
      title: "⚠️ Alerta: Mudança Climática",
      body: "A probabilidade de chuva aumentou para 80% na sua data de evento",
      url: "/results"
    }
  });
};
\`\`\`

## 📋 Checklist de Implementação

- [x] Tabela `push_subscriptions` criada no Supabase
- [ ] Chaves VAPID geradas e configuradas
- [x] Service Worker registrado
- [x] Componente PushNotificationToggle integrado
- [x] Funções de gerenciamento criadas
- [ ] Edge Function de envio deployada
- [ ] Lógica de detecção de mudanças implementada
- [ ] Testes realizados

## 🐛 Troubleshooting

### Notificações não aparecem?

1. **Verificar permissões** do navegador
2. **Service Worker ativo**? (DevTools → Application)
3. **VAPID_PUBLIC_KEY** configurada?
4. **HTTPS ou localhost**? (Push requer conexão segura)

### Erro ao salvar inscrição?

1. Usuário está **autenticado**?
2. Tabela **criada** no Supabase?
3. **RLS policies** configuradas?

### Service Worker não registra?

1. Arquivo em **`public/service-worker.js`**?
2. Caminho correto: **`/service-worker.js`**?
3. Console tem erros?

## 🎨 Personalização

### Mudar Ícone da Notificação:

\`\`\`javascript
// Em service-worker.js
icon: "/custom-icon.png"
\`\`\`

### Adicionar Ações:

\`\`\`javascript
options.actions = [
  { action: "view", title: "Ver Detalhes" },
  { action: "dismiss", title: "Ignorar" }
];
\`\`\`

## 📚 Referências

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Keys](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/)

---

**Status**: ✅ Frontend implementado, aguardando configuração VAPID
**Última atualização**: 2025-10-04
