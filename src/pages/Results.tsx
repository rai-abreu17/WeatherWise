import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { ComfortIndex } from "@/components/ComfortIndex";
import { AlternativeDate } from "@/components/AlternativeDate";
import { AboutDialog } from "@/components/AboutDialog";
import { 
  Cloud, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  Sun, 
  TrendingUp, 
  ArrowLeft,
  Calendar,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DateData {
  date: string;
  displayDate: string;
  icp: number;
  rainProbability: number;
  temperature: number;
  temperatureRange: string;
  windSpeed: number;
  windDescription: string;
  humidity: number;
  humidityDescription: string;
  cloudCover: number;
  cloudDescription: string;
  extremeEvents: number;
  extremeDescription: string;
  alertMessage?: string;
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get analysis data from navigation state
    const data = location.state?.analysisData;
    
    if (!data) {
      toast.error("Nenhum dado de análise encontrado");
      navigate("/");
      return;
    }
    
    setAnalysisData(data);
    setIsLoading(false);
  }, [location, navigate]);

  if (isLoading || !analysisData) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Cloud className="w-16 h-16 animate-pulse mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Carregando análise climática...</p>
        </div>
      </div>
    );
  }

  // Get current date data based on selection (0 = requested date, 1+ = alternatives)
  const allDates = [analysisData.requestedDate, ...analysisData.alternativeDates];
  const currentData = allDates[selectedDateIndex];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Você saiu da conta");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                WeatherWise Planner
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AboutDialog />
            <Button variant="hero" size="sm" onClick={() => navigate("/")}>
              Nova Consulta
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Results Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Event Info */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{analysisData.location.name} • {currentData.displayDate}</span>
            </div>
            <h1 className="text-4xl font-bold">Análise Climática Completa</h1>
          </div>

          {/* Comfort Index */}
          <div className="animate-slide-up">
            <ComfortIndex score={currentData.icp} />
          </div>

          {/* Metrics Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Métricas Climáticas Detalhadas</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                icon={CloudRain}
                title="Probabilidade de Chuva"
                value={`${currentData.rainProbability}%`}
                description="Nos últimos 20 anos, choveu em 7 dos 20 dias nesta data"
                iconColor="text-primary"
              />
              <MetricCard
                icon={Thermometer}
                title="Temperatura Média"
                value={`${currentData.temperature}°C`}
                description={`Variação: ${currentData.temperatureRange}`}
                iconColor="text-warning"
              />
              <MetricCard
                icon={Wind}
                title="Velocidade do Vento"
                value={`${currentData.windSpeed} km/h`}
                description={currentData.windDescription}
                iconColor="text-secondary"
              />
              <MetricCard
                icon={Droplets}
                title="Umidade Relativa"
                value={`${currentData.humidity}%`}
                description={currentData.humidityDescription}
                iconColor="text-accent"
              />
              <MetricCard
                icon={Cloud}
                title="Cobertura de Nuvens"
                value={`${currentData.cloudCover}%`}
                description={currentData.cloudDescription}
                iconColor="text-muted-foreground"
              />
              <MetricCard
                icon={Sun}
                title="Eventos Extremos"
                value={`${currentData.extremeEvents}%`}
                description={currentData.extremeDescription}
                iconColor="text-warning"
              />
            </div>
          </div>

          {/* Alert */}
          {currentData.alertMessage && (
            <Card className="glass-effect p-6 border-l-4 border-warning animate-slide-up">
              <div className="flex gap-4">
                <div className="p-3 bg-warning/10 rounded-lg h-fit">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    Alerta de Tendência Climática
                  </h3>
                  <p className="text-muted-foreground">
                    {currentData.alertMessage}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Alternative Dates */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Datas Alternativas Recomendadas</h2>
              <Button variant="ghost" size="sm">Ver Mais</Button>
            </div>
            <Card className="glass-effect p-6">
              <p className="text-muted-foreground mb-4">
                Baseado em dados históricos de {analysisData.dataSource.period}, estas datas têm melhores condições climáticas:
              </p>
              <div className="space-y-3">
                {allDates.map((dateData, index) => (
                  <AlternativeDate
                    key={dateData.date}
                    date={dateData.displayDate}
                    rainProbability={dateData.rainProbability}
                    temperature={dateData.temperature}
                    icp={dateData.icp}
                    isSelected={selectedDateIndex === index}
                    onClick={() => {
                      setSelectedDateIndex(index);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Data Source */}
          <div className="text-center py-8">
            <Card className="glass-effect inline-block px-8 py-4">
              <p className="text-sm text-muted-foreground">
                Análise baseada em {analysisData.dataSource.yearsAnalyzed} anos de dados históricos ({analysisData.dataSource.period})
                <br />
                <span className="font-semibold text-foreground">{analysisData.dataSource.provider}</span>
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Desenvolvido para o NASA Space Apps Challenge 2025</p>
          <p className="mt-2">Dados fornecidos pela NASA Earth Observations</p>
        </div>
      </footer>
    </div>
  );
};

export default Results;
