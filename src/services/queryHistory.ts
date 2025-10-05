import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type QueryHistoryRow = Tables<"query_history">;
type QueryHistoryInsert = TablesInsert<"query_history">;

export const saveQueryToHistory = async (query: Omit<QueryHistoryInsert, 'id' | 'user_id' | 'created_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Não é possível salvar o histórico de consultas.");
    return null;
  }

  const { data, error } = await supabase
    .from("query_history")
    .insert({
      user_id: user.id,
      location_name: query.location_name,
      latitude: query.latitude,
      longitude: query.longitude,
      query_date: query.query_date,
    })
    .select();

  if (error) {
    console.error("Erro ao salvar histórico de consulta:", error);
    return null;
  }
  return data;
};

export const getQueryHistory = async (): Promise<QueryHistoryRow[] | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Não é possível obter o histórico de consultas.");
    return null;
  }

  const { data, error } = await supabase
    .from("query_history")
    .select("id, location_name, latitude, longitude, query_date, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao obter histórico de consultas:", error);
    return null;
  }
  return data;
};

export const deleteQueryFromHistory = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Não é possível deletar o histórico de consultas.");
    return null;
  }

  const { error } = await supabase
    .from("query_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Garante que o usuário só pode deletar suas próprias consultas

  if (error) {
    console.error("Erro ao deletar histórico de consulta:", error);
    return false;
  }
  return true;
};
