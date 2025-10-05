import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { savePushSubscription, deletePushSubscription } from "@/services/pushNotifications";
import { Bell, BellOff } from "lucide-react";

// IMPORTANTE: Você precisa gerar suas chaves VAPID
// Visite: https://web-push-codelab.glitch.me/
// Cole sua chave pública aqui
const VAPID_PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY_HERE"; 

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const PushNotificationToggle: React.FC = () => {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Notificações Push não são suportadas neste navegador.");
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushEnabled(!!subscription);
      } catch (error) {
        console.error("Erro ao verificar inscrição:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSubscription();
  }, []);

  const subscribeUser = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Notificações Push não são suportadas neste navegador.");
      return;
    }

    if (VAPID_PUBLIC_KEY === "YOUR_VAPID_PUBLIC_KEY_HERE") {
      toast.error("Chave VAPID não configurada. Configure no componente PushNotificationToggle.");
      return;
    }

    setIsLoading(true);
    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada.");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      };
      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // Salvar a inscrição no Supabase
      await savePushSubscription(subscription);
      setIsPushEnabled(true);
      toast.success("Notificações ativadas! Você receberá alertas sobre mudanças climáticas.");
    } catch (error) {
      console.error("Erro ao inscrever para notificações push:", error);
      toast.error("Erro ao ativar notificações. Verifique as permissões do navegador.");
      setIsPushEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await deletePushSubscription(subscription.endpoint);
        setIsPushEnabled(false);
        toast.info("Notificações desativadas.");
      }
    } catch (error) {
      console.error("Erro ao desinscrever de notificações push:", error);
      toast.error("Erro ao desativar notificações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribeUser();
    } else {
      await unsubscribeUser();
    }
  };

  if (!isSupported) {
    return null; // Não mostrar o toggle se não for suportado
  }

  return (
    <div className="glass-effect-strong p-6 rounded-2xl border-2 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isPushEnabled ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="push-notifications" className="text-base font-semibold cursor-pointer">
              Alertas de Mudanças Climáticas
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba notificações quando houver mudanças significativas
            </p>
          </div>
        </div>
        <Switch
          id="push-notifications"
          checked={isPushEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default PushNotificationToggle;
