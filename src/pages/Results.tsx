import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { ComfortIndex } from "@/components/ComfortIndex";
import { AlternativeDate } from "@/components/AlternativeDate";
import { AboutDialog } from "@/components/AboutDialog";
import PdfExportButton from "@/components/PdfExportButton";
import ClimateChart from "@/components/ClimateChart";
import NotificationButton from "@/components/NotificationButton";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  LogOut,
  User
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
    
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
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-xl hover-lift">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 gradient-primary rounded-2xl shadow-glow-primary">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                WeatherWise
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AboutDialog />
            <PdfExportButton rootElementId="report-content" fileName="relatorio-event-sky-insight.pdf" buttonText="Exportar PDF" />
            <Button variant="hero" size="sm" onClick={() => navigate("/")} className="rounded-xl shadow-glow-primary">
              Nova Consulta
            </Button>
            <ThemeToggle />
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl">
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="rounded-xl">
                <User className="w-4 h-4" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Results Content */}
      <div id="report-content">
        <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Event Info */}
          <div className="animate-fade-in glass-effect-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-base font-semibold">{analysisData.location.name} • {currentData.displayDate}</span>
              </div>
              <NotificationButton locationName={analysisData.location.name} />
            </div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Análise Climática Completa
            </h1>
          </div>

          {/* Comfort Index */}
          <div className="animate-slide-up">
            <ComfortIndex score={currentData.icp} />
          </div>

          {/* Climate Chart */}
          <div className="animate-slide-up">
            <ClimateChart analysisData={analysisData} />
          </div>

          {/* Metrics Grid */}
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Métricas Climáticas Detalhadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Card className="glass-effect-strong p-8 border-l-4 border-warning animate-slide-up rounded-2xl hover-lift shadow-glow-secondary">
              <div className="flex gap-6">
                <div className="p-4 bg-warning/15 rounded-2xl h-fit shadow-lg">
                  <TrendingUp className="w-8 h-8 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-3 text-warning">
                    Alerta de Tendência Climática
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {currentData.alertMessage}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Alternative Dates */}
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Datas Alternativas Recomendadas
              </h2>
            </div>
            <Card className="glass-effect-strong p-8 rounded-2xl border-2">
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                Baseado em dados históricos, estas datas têm melhores condições climáticas:
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
          <div className="text-center py-12">
            <Card className="glass-effect-strong inline-block px-10 py-6 rounded-2xl shadow-xl hover-lift">
              <p className="text-base text-muted-foreground leading-relaxed">
                Análise baseada em <span className="font-bold text-foreground">{analysisData.dataSource.yearsAnalyzed} anos</span> de dados históricos ({analysisData.dataSource.period})
                <br />
                <span className="font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2 inline-block">{analysisData.dataSource.provider}</span>
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
    </div>
  );
};

export default Results;
