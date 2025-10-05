import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { savePushSubscription, deletePushSubscription } from "@/services/pushNotifications";
import { Bell, BellOff, LogIn } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// IMPORTANTE: Chave VAPID pública configurada
const VAPID_PUBLIC_KEY = "BDxMItW5Gd3Shvcst00uT5AutfkdaLCcjJtG83bJzND0juEuEyzeki7U-Ix1GM72-uwTewI9ytWzd_egNGs1N_0"; 

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

interface NotificationButtonProps {
  locationName: string;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ locationName }) => {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      console.log('NotificationButton: Checking auth and subscription...');
      
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);
      console.log('User authenticated:', authenticated);
      
      if (!authenticated) {
        setIsLoading(false);
        return;
      }
      
      console.log('ServiceWorker supported:', 'serviceWorker' in navigator);
      console.log('PushManager supported:', 'PushManager' in window);
      
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn('Push notifications not supported');
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushEnabled(!!subscription);
        console.log('Current subscription status:', !!subscription);
      } catch (error) {
        console.error("Erro ao verificar inscrição:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndSubscription();
  }, []);

  const subscribeUser = async () => {
    setIsLoading(true);
    try {
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

      await savePushSubscription(subscription);
      setIsPushEnabled(true);
      toast.success(`Alertas ativados para ${locationName}! Você será notificado sobre mudanças climáticas.`, {
        duration: 5000,
      });
    } catch (error) {
      console.error("Erro ao inscrever para notificações push:", error);
      toast.error("Erro ao ativar alertas. Verifique as permissões do navegador.");
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
        toast.info("Alertas desativados.");
      }
    } catch (error) {
      console.error("Erro ao desinscrever de notificações push:", error);
      toast.error("Erro ao desativar alertas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    if (isPushEnabled) {
      await unsubscribeUser();
    } else {
      await subscribeUser();
    }
  };

  const handleGoToLogin = () => {
    setShowAuthDialog(false);
    navigate('/auth');
  };

  console.log('NotificationButton render:', { isSupported, isPushEnabled, isLoading, isAuthenticated, locationName });

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPushEnabled ? "default" : "outline"}
              size="icon"
              onClick={handleToggle}
              disabled={isLoading || !isSupported}
              className={`rounded-full ${isPushEnabled ? 'shadow-glow-primary animate-pulse-slow' : ''}`}
              title={!isSupported ? 'Notificações não suportadas neste navegador' : !isAuthenticated ? 'Faça login para ativar alertas' : ''}
            >
              {!isAuthenticated ? (
                <LogIn className="w-4 h-4 text-muted-foreground" />
              ) : isPushEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {!isAuthenticated
                ? 'Faça login para ativar alertas climáticos'
                : !isSupported 
                  ? 'Notificações push não são suportadas neste navegador'
                  : isPushEnabled 
                    ? `Alertas ativados para ${locationName}` 
                    : `Ativar alertas de mudanças climáticas`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔔 Alertas Climáticos</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Para receber alertas sobre mudanças climáticas em <strong>{locationName}</strong>, 
                você precisa ter uma conta no WeatherWise.
              </p>
              <p className="text-sm">
                Com alertas ativados, você será notificado quando:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                <li>A probabilidade de chuva aumentar significativamente</li>
                <li>A temperatura mudar drasticamente</li>
                <li>Condições climáticas afetarem seu evento</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToLogin}>
              <LogIn className="w-4 h-4 mr-2" />
              Fazer Login / Cadastrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NotificationButton;
