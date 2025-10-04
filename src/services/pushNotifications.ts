import { supabase } from "@/integrations/supabase/client";

interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const savePushSubscription = async (subscription: PushSubscription) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Não é possível salvar a inscrição de notificação.");
    return null;
  }

  const subscriptionData: PushSubscriptionData = subscription.toJSON() as PushSubscriptionData;

  const { data, error } = await supabase
    .from("push_subscriptions")
    .insert({
      user_id: user.id,
      subscription: subscriptionData,
    })
    .select();

  if (error) {
    console.error("Erro ao salvar inscrição de notificação:", error);
    return null;
  }
  return data;
};

export const deletePushSubscription = async (endpoint: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Não é possível deletar a inscrição de notificação.");
    return null;
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("subscription->>endpoint", endpoint); // Deleta a inscrição específica

  if (error) {
    console.error("Erro ao deletar inscrição de notificação:", error);
    return false;
  }
  return true;
};

export const getPushSubscriptions = async (): Promise<PushSubscriptionData[] | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Não é possível obter as inscrições de notificação.");
    return null;
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao obter inscrições de notificação:", error);
    return null;
  }
  return data ? data.map(item => item.subscription as PushSubscriptionData) : null;
};
