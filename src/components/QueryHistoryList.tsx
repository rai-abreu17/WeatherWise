import React, { useEffect, useState } from "react";
import { getQueryHistory, deleteQueryFromHistory } from "@/services/queryHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, History, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface QueryHistoryItem {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  query_date: string;
  created_at: string;
}

const QueryHistoryList: React.FC = () => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setIsLoading(true);
    const data = await getQueryHistory();
    if (data) {
      setHistory(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar esta consulta do histórico?")) {
      const success = await deleteQueryFromHistory(id);
      if (success) {
        toast.success("Consulta deletada do histórico.");
        fetchHistory(); // Recarrega o histórico
      } else {
        toast.error("Erro ao deletar consulta.");
      }
    }
  };

  const handleReRunQuery = (item: QueryHistoryItem) => {
    // Aqui você precisaria de uma forma de re-executar a consulta
    // Isso pode envolver navegar para a página inicial com os dados pré-preenchidos
    // ou chamar a função de análise diretamente e navegar para os resultados.
    // Por simplicidade, vamos navegar para a página inicial com a localização e data.
    navigate("/", { state: { locationName: item.location_name, date: new Date(item.query_date) } });
    toast.info(`Re-executando consulta para ${item.location_name} em ${item.query_date}`);
  };

  if (isLoading) {
    return <p>Carregando histórico...</p>;
  }

  if (history.length === 0) {
    return <p className="text-muted-foreground text-center">Nenhuma consulta no histórico ainda.</p>;
  }

  return (
    <Card className="glass-effect-strong p-6 rounded-2xl animate-slide-up">
      <CardHeader>
        <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
          Histórico de Consultas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
            <div className="flex flex-col">
              <span className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> {item.location_name}
              </span>
              <span className="text-sm text-muted-foreground ml-7">
                Data: {new Date(item.query_date).toLocaleDateString()}
              </span>
              <span className="text-xs text-muted-foreground ml-7">
                Consultado em: {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleReRunQuery(item)}>
                <History className="w-4 h-4 mr-2" /> Re-consultar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QueryHistoryList;
