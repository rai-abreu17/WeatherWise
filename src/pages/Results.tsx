import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { ComfortIndex } from "@/components/ComfortIndex";
import { AlternativeDate } from "@/components/AlternativeDate";
import { AboutDialog } from "@/components/AboutDialog";
import DirectPdfExport from "@/components/DirectPdfExport";
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
  User,
  Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Helper function to format location name for display
const formatLocationName = (fullName: string): { short: string; full: string } => {
  // Split by comma and trim
  const parts = fullName.split(',').map(s => s.trim());
  
  if (parts.length === 0) {
    return { short: fullName, full: fullName };
  }
  
  // Strategy for Brazilian addresses:
  // Typical format: "Street, Neighborhood, City, State, Postal Code, Country"
  // Agora queremos mostrar: "Rua, Bairro" para a versão curta
  
  let shortName: string;
  
  if (parts.length <= 2) {
    // Already short enough
    shortName = fullName;
  } else if (parts.length >= 3) {
    // Para qualquer endereço com 3+ partes, 
    // sempre pegamos as duas primeiras partes (Rua, Bairro)
    shortName = `${parts[0]}, ${parts[1]}`;
  } else {
    shortName = fullName;
  }
  
  return {
    short: shortName,
    full: fullName
  };
};

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
  const [allAnalysisData, setAllAnalysisData] = useState<any[]>([]);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bestLocationName, setBestLocationName] = useState<string | null>(null);
  
  // Modo evento: quando vem de um EventCard
  const eventMode = location.state?.eventMode;
  const eventData = location.state?.eventData;

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
    
    // Se estiver no modo evento, redirecionar para Index com dados pré-preenchidos
    if (eventMode && eventData) {
      navigate('/', {
        state: {
          eventPlanningMode: true,
          eventData: eventData,
        },
      });
      return;
    }
    
    // Get analysis data from navigation state
    const data = location.state?.analysisData;
    
    if (!data) {
      toast.error("Nenhum dado de análise encontrado. Por favor, faça uma nova consulta.", {
        duration: 5000,
        icon: <Cloud className="w-5 h-5 text-destructive" />
      });
      navigate("/");
      return;
    }

    // Se data é um array, temos múltiplas localizações
    if (Array.isArray(data)) {
      setAllAnalysisData(data);
      
      // Encontrar a localização com o maior ICP
      let maxIcp = -1;
      let bestName: string | null = null;
      data.forEach((analysis: any) => {
        if (analysis.requestedDate.icp > maxIcp) {
          maxIcp = analysis.requestedDate.icp;
          bestName = analysis.location.name;
        }
      });
      setBestLocationName(bestName);
    } else {
      // Compatibilidade com análise única (formato antigo)
      setAllAnalysisData([data]);
    }
    
    setIsLoading(false);
  }, [location, navigate]);

  if (isLoading || allAnalysisData.length === 0) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Cloud className="w-16 h-16 animate-pulse mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Carregando análise climática...</p>
        </div>
      </div>
    );
  }

  // Get current analysis based on selected location
  const currentAnalysis = allAnalysisData[selectedLocationIndex];
  // Get current date data based on selection (0 = requested date, 1+ = alternatives)
  const allDates = [currentAnalysis.requestedDate, ...currentAnalysis.alternativeDates];
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
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50 shadow-lg" role="banner">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-xl hover-lift" aria-label="Voltar para página inicial">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Voltar
            </Button>
            <div className="flex items-center gap-3" role="img" aria-label="Logo WeatherWise">
              <div className="p-3 gradient-primary rounded-2xl shadow-glow-primary">
                <Cloud className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                WeatherWise
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-3" aria-label="Ações e navegação">
            <AboutDialog />
            <DirectPdfExport 
              analysisData={allAnalysisData}
              fileName={`relatorio-${currentAnalysis.location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`}
              buttonText="Exportar PDF"
            />
            <Button variant="hero" size="sm" onClick={() => navigate("/")} className="rounded-xl shadow-glow-primary" aria-label="Iniciar nova consulta">
              Nova Consulta
            </Button>
            <ThemeToggle />
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl" aria-label="Sair da conta">
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="rounded-xl" aria-label="Entrar na sua conta">
                <User className="w-4 h-4" aria-hidden="true" />
                Entrar
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Results Content */}
      <main id="main-content" className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {allAnalysisData.length > 1 ? "Comparação de Análises Climáticas" : "Análise Climática Completa"}
          </h1>

          {/* Se múltiplas localizações, usar Tabs para comparação */}
          {allAnalysisData.length > 1 ? (
            <Tabs value={currentAnalysis.location.name} className="w-full">
              <TabsList 
                className="grid w-full mb-8" 
                style={{ gridTemplateColumns: `repeat(${allAnalysisData.length}, minmax(0, 1fr))` }}
                role="tablist"
                aria-label="Comparação de localizações"
              >
                {allAnalysisData.map((analysis, index) => {
                  const { short: shortName, full: fullName } = formatLocationName(analysis.location.name);
                  return (
                    <TabsTrigger 
                      key={analysis.location.name} 
                      value={analysis.location.name} 
                      onClick={() => {
                        setSelectedLocationIndex(index);
                        setSelectedDateIndex(0); // Reset date selection ao mudar de localização
                      }}
                      className={`relative ${analysis.location.name === bestLocationName ? 'data-[state=active]:border-b-2 data-[state=active]:border-primary' : ''}`}
                      role="tab"
                      aria-label={`${fullName}${analysis.location.name === bestLocationName ? ' - Melhor opção' : ''}`}
                      title={fullName}
                    >
                      <div className="flex items-center gap-2">
                        {shortName}
                        {analysis.location.name === bestLocationName && (
                          <Trophy className="w-4 h-4 text-primary" aria-label="Troféu - Melhor localização" />
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {allAnalysisData.map((analysis, index) => {
                const { short: shortName, full: fullName } = formatLocationName(analysis.location.name);
                return (
                  <TabsContent key={analysis.location.name} value={analysis.location.name} role="tabpanel">
                    {/* Event Info */}
                    <div className="animate-fade-in glass-effect-strong p-6 rounded-2xl mb-8">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Calendar className="w-5 h-5" />
                          <span className="text-base font-semibold" title={fullName}>
                            {shortName} • {currentData.displayDate}
                          </span>
                          {analysis.location.name === bestLocationName && (
                            <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Melhor ICP
                            </span>
                          )}
                      </div>
                      <NotificationButton locationName={analysis.location.name} />
                    </div>
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent" title={fullName}>
                      Análise para {fullName}
                    </h2>
                  </div>

                  {/* Comfort Index */}
                  <div className="animate-slide-up mb-8">
                    <ComfortIndex score={currentData.icp} />
                  </div>

                  {/* Climate Chart */}
                  <div className="animate-slide-up mb-8">
                    <ClimateChart analysisData={analysis} />
                  </div>

                  {/* Metrics Grid */}
                  <div className="space-y-6 mb-8">
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      Métricas Climáticas Detalhadas
                    </h3>
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
                    <Card className="glass-effect-strong p-8 border-l-4 border-warning animate-slide-up rounded-2xl hover-lift shadow-glow-secondary mb-8">
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
                      <h3 className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Datas Alternativas Recomendadas
                      </h3>
                    </div>
                    <Card className="glass-effect-strong p-8 rounded-2xl border-2">
                      <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                        Baseado em dados históricos, estas datas têm melhores condições climáticas:
                      </p>
                      <div className="space-y-3">
                        {allDates.map((dateData, dateIndex) => (
                          <AlternativeDate
                            key={dateData.date}
                            date={dateData.displayDate}
                            rainProbability={dateData.rainProbability}
                            temperature={dateData.temperature}
                            icp={dateData.icp}
                            isSelected={selectedDateIndex === dateIndex}
                            onClick={() => {
                              setSelectedDateIndex(dateIndex);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          />
                        ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}
            </Tabs>
          ) : (
            // Renderização para localização única (compatibilidade)
            (() => {
              const { short: shortName, full: fullName } = formatLocationName(currentAnalysis.location.name);
              return (
                <>
                  {/* Event Info */}
                  <div className="animate-fade-in glass-effect-strong p-6 rounded-2xl">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar className="w-5 h-5" />
                        <span className="text-base font-semibold" title={fullName}>
                          {shortName} • {currentData.displayDate}
                        </span>
                      </div>
                      <NotificationButton locationName={currentAnalysis.location.name} />
                    </div>
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent" title={fullName}>
                      Análise para {fullName}
                    </h2>
                  </div>

              {/* Comfort Index */}
              <div className="animate-slide-up">
                <ComfortIndex score={currentData.icp} />
              </div>

              {/* Climate Chart */}
              <div className="animate-slide-up">
                <ClimateChart analysisData={currentAnalysis} />
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
                    {allDates.map((dateData, dateIndex) => (
                      <AlternativeDate
                        key={dateData.date}
                        date={dateData.displayDate}
                        rainProbability={dateData.rainProbability}
                        temperature={dateData.temperature}
                        icp={dateData.icp}
                        isSelected={selectedDateIndex === dateIndex}
                        onClick={() => {
                          setSelectedDateIndex(dateIndex);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            </>
              );
            })()
          )}

          {/* Data Source */}
          <div className="text-center py-12">
            <Card className="glass-effect-strong inline-block px-10 py-6 rounded-2xl shadow-xl hover-lift">
              <p className="text-base text-muted-foreground leading-relaxed">
                Análise baseada em <span className="font-bold text-foreground">{currentAnalysis.dataSource.yearsAnalyzed} anos</span> de dados históricos ({currentAnalysis.dataSource.period})
                <br />
                <span className="font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2 inline-block">{currentAnalysis.dataSource.provider}</span>
              </p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-12">
          <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
            <p>Desenvolvido para o NASA Space Apps Challenge 2025</p>
            <p className="mt-2">Dados fornecidos pela NASA Earth Observations</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Results;
