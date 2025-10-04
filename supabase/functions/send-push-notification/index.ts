import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error("VAPID keys not configured");
    }

    webpush.setVapidDetails(
      "mailto:your-email@example.com", // Substitua pelo seu email
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use service role para acessar todas as inscrições
    );

    const { title, body, url, user_id } = await req.json();

    // Buscar inscrições
    let query = supabaseClient
      .from("push_subscriptions")
      .select("subscription");
    
    // Se user_id foi fornecido, enviar apenas para esse usuário
    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Erro ao buscar inscrições:", error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma inscrição encontrada" }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const notificationPayload = JSON.stringify({
      title: title || "WeatherWise - Alerta Climático",
      body: body || "Você tem uma nova notificação sobre condições climáticas.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      url: url || "/results",
      tag: "weather-alert",
    });

    console.log(`Enviando notificações para ${subscriptions.length} dispositivos...`);

    const pushPromises = subscriptions.map((sub: any) =>
      webpush.sendNotification(sub.subscription, notificationPayload)
        .then(() => {
          console.log("Notificação enviada com sucesso");
          return { success: true };
        })
        .catch((err) => {
          console.error("Erro ao enviar push:", err);
          return { success: false, error: err.message };
        })
    );

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `${successCount} de ${subscriptions.length} notificações enviadas com sucesso`,
        results 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
