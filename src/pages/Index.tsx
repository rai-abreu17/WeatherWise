import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Cloud, Calendar, Sparkles, LogOut, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AboutDialog } from "@/components/AboutDialog";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { climateAnalysisSchema } from "@/lib/validations";
import InteractiveMap from "@/components/InteractiveMap";
import QueryHistoryList from "@/components/QueryHistoryList";
import { saveQueryToHistory } from "@/services/queryHistory";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SelectedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [temperature, setTemperature] = useState([25]);
  const [userEmail, setUserEmail] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);
  const [currentLocationInput, setCurrentLocationInput] = useState("");
  const [pendingLocation, setPendingLocation] = useState<SelectedLocation | null>(null);
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

  // Handle location selection from autocomplete
  const handleLocationSelect = (locationName: string, latitude: number, longitude: number) => {
    setPendingLocation({ name: locationName, latitude, longitude });
    setCurrentLocationInput(locationName); // Atualizar o campo com o nome completo
  };

  // Add pending location to the list
  const handleAddLocation = () => {
    if (!pendingLocation) {
      toast.error("Selecione uma localização primeiro");
      return;
    }

    // Evitar duplicatas
    if (selectedLocations.some(loc => loc.name === pendingLocation.name)) {
      toast.info("Localização já adicionada");
      return;
    }

    setSelectedLocations(prev => [...prev, pendingLocation]);
    setCurrentLocationInput("");
    setPendingLocation(null);
    toast.success(`${pendingLocation.name} adicionada!`);
  };

  const handleRemoveLocation = (locationName: string) => {
    setSelectedLocations(prev => prev.filter(loc => loc.name !== locationName));
    toast.success("Localização removida");
  };

  // Update map coordinates based on selected locations
  useEffect(() => {
    if (selectedLocations.length > 0) {
      // Show the first location on the map
      const firstLocation = selectedLocations[0];
      setLocationCoordinates({
        lat: firstLocation.latitude,
        lon: firstLocation.longitude
      });
    } else if (pendingLocation) {
      // Show pending location on the map
      setLocationCoordinates({
        lat: pendingLocation.latitude,
        lon: pendingLocation.longitude
      });
    } else {
      setLocationCoordinates(null);
    }
  }, [selectedLocations, pendingLocation]);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || "");
        setIsLoggedIn(true);
      } else {
        setUserEmail("");
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Você saiu da conta");
      navigate("/auth");
    }
  };

  const handleAnalyze = async () => {
    // Validate inputs
    if (selectedLocations.length === 0) {
      toast.error("Por favor, selecione pelo menos uma localização.");
      return;
    }

    if (!date) {
      toast.error("Por favor, selecione uma data.");
      return;
    }

    if (!eventType) {
      toast.error("Por favor, selecione um tipo de evento.");
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // SOLUÇÃO TEMPORÁRIA: Se tiver apenas 1 localização, usar formato antigo
      // para compatibilidade com Edge Function não atualizada
      let requestData: any;
      
      if (selectedLocations.length === 1) {
        // Formato antigo (compatível com Edge Function atual)
        requestData = {
          location: selectedLocations[0].name,
          date: date,
          eventType: eventType,
          preferredTemperature: temperature[0]
        };
        console.log('Using legacy format (single location):', requestData);
      } else {
        // Formato novo (requer Edge Function atualizada)
        requestData = {
          locations: selectedLocations.map(loc => ({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude
          })),
          date: date,
          eventType: eventType,
          preferredTemperature: temperature[0]
        };
        console.log('Using new format (multiple locations):', requestData);
      }

      console.log('Calling climate-analysis function with data:', requestData);
      
      const { data, error } = await supabase.functions.invoke('climate-analysis', {
        body: requestData
      });

      console.log('Response:', { data, error });

      if (error) {
        console.error('Edge function error details:', error);
        
        // Tentar obter mais detalhes do erro
        let errorMessage = 'Erro desconhecido na análise climática';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.context?.error) {
          errorMessage = error.context.error;
        }
        
        // Se houver detalhes sobre a localização, incluir
        if (data?.error) {
          errorMessage = `${errorMessage}: ${data.error}`;
        }
        
        toast.error(`Erro na análise: ${errorMessage}`);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw new Error(errorMessage);
      }

      if (!data) {
        toast.error('Nenhum dado retornado pela análise');
        throw new Error('Nenhum dado retornado pela função de análise');
      }
      
      // Verificar se alguma localização retornou erro
      if (Array.isArray(data)) {
        const errorsFound = data.filter(item => item.error);
        if (errorsFound.length > 0) {
          console.error('Errors in locations:', errorsFound);
          const errorLocs = errorsFound.map(e => e.location.name).join(', ');
          toast.error(`Erro ao analisar: ${errorLocs}`);
        }
      }

      console.log('Analysis result:', data);

      // Salvar a consulta no histórico ANTES de navegar
      if (isLoggedIn) {
        for (const loc of selectedLocations) {
          await saveQueryToHistory({
            location_name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            query_date: date,
          });
        }
      }
      
      // Navigate to results page with the data
      // Se usamos formato antigo (1 localização), converter para array para Results.tsx
      const analysisData = Array.isArray(data) ? data : [data];
      navigate("/results", { state: { analysisData } });
      
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Erro ao analisar dados climáticos. Por favor, tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50 shadow-lg" role="banner">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3" role="img" aria-label="Logo WeatherWise">
            <div className="p-3 gradient-primary rounded-2xl shadow-glow-primary">
              <Cloud className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              WeatherWise
            </span>
          </div>
          <nav className="flex items-center gap-3" aria-label="Navegação principal">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-muted-foreground hidden md:block glass-effect px-4 py-2 rounded-xl">
                  {userEmail}
                </span>
                <AboutDialog />
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="rounded-xl"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <AboutDialog />
                <ThemeToggle />
                <Button 
                  variant="hero" 
                  size="sm" 
                  onClick={() => navigate("/auth")} 
                  className="rounded-xl shadow-glow-primary"
                  aria-label="Entrar na sua conta"
                >
                  Entrar
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content" className="container mx-auto px-4 pt-4 pb-6 md:py-20">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-12">
          {/* Hero Text */}
          <div className="text-center space-y-3 md:space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-effect rounded-full text-sm text-primary font-semibold mb-2 shadow-glow-primary">
              <Sparkles className="w-4 h-4 animate-float" />
              NASA Space Apps Challenge 2025
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Descubra as Probabilidades
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                Climáticas do Seu Evento
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Use décadas de dados de observação da Terra da NASA para planejar eventos, 
              atividades agrícolas e muito mais com <span className="font-semibold text-foreground">precisão sem precedentes.</span>
            </p>
          </div>

          {/* Search Form */}
          <Card className="glass-effect-strong p-4 md:p-10 shadow-2xl animate-slide-up hover-lift rounded-2xl border-2">
            <form 
              className="space-y-8" 
              role="search" 
              aria-label="Formulário de análise climática"
              onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
            >
              <fieldset className="space-y-2">
                <legend className="sr-only">Seleção de Localizações</legend>
                <Label htmlFor="location" className="text-base font-semibold">
                  Localizações do Evento
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <LocationAutocomplete
                      value={currentLocationInput}
                      onChange={setCurrentLocationInput}
                      onSelect={handleLocationSelect}
                      disabled={isAnalyzing}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddLocation}
                    disabled={!pendingLocation || isAnalyzing}
                    className="h-12 px-4 rounded-xl shadow-glow-primary"
                    variant="hero"
                    aria-label="Adicionar localização à lista"
                  >
                    <Plus className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </div>
                {/* Tags de localizações selecionadas */}
                {selectedLocations.length > 0 && (
                  <div 
                    className="flex flex-wrap gap-2 mt-2 animate-fade-in" 
                    role="list" 
                    aria-label="Localizações selecionadas"
                  >
                    {selectedLocations.map(loc => (
                      <Badge key={loc.name} variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm" role="listitem">
                        {loc.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveLocation(loc.name)}
                          disabled={isAnalyzing}
                          aria-label={`Remover ${loc.name} da lista`}
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Hint text */}
                <p className="text-xs text-muted-foreground mt-2" id="location-hint" role="status" aria-live="polite">
                  {selectedLocations.length === 0 
                    ? "Adicione pelo menos uma localização para comparar" 
                    : `${selectedLocations.length} localização${selectedLocations.length > 1 ? 'ões' : ''} adicionada${selectedLocations.length > 1 ? 's' : ''}`
                  }
                </p>
              </fieldset>

              {/* Interactive Map */}
              {selectedLocations.length > 0 && (
                <div className="animate-fade-in" role="region" aria-label="Mapa interativo da localização">
                  <InteractiveMap 
                    locationName={selectedLocations[0].name} 
                    coordinates={locationCoordinates}
                  />
                </div>
              )}

              <fieldset className="grid md:grid-cols-2 gap-6">
                <legend className="sr-only">Informações do Evento</legend>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-semibold">
                    Data do Evento
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" aria-hidden="true" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10 h-12 text-base"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      aria-label="Selecione a data do evento"
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-type" className="text-base font-semibold">
                    Tipo de Evento
                  </Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="h-12 text-base" id="event-type" aria-label="Selecione o tipo de evento">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="wedding">Casamento</SelectItem>
                      <SelectItem value="sports">Evento Esportivo</SelectItem>
                      <SelectItem value="festival">Festival/Show</SelectItem>
                      <SelectItem value="agriculture">Atividade Agrícola</SelectItem>
                      <SelectItem value="corporate">Evento Corporativo</SelectItem>
                      <SelectItem value="outdoor">Atividade ao Ar Livre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="sr-only">Configuração de Temperatura</legend>
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature-slider" className="text-base font-semibold">
                    Faixa de Temperatura Confortável
                  </Label>
                  <span className="text-sm font-semibold text-primary" id="temperature-value" aria-live="polite">
                    {temperature[0]}°C
                  </span>
                </div>
                <Slider
                  id="temperature-slider"
                  value={temperature}
                  onValueChange={setTemperature}
                  min={15}
                  max={40}
                  step={1}
                  className="py-4"
                  aria-label="Ajuste a temperatura confortável"
                  aria-valuemin={15}
                  aria-valuemax={40}
                  aria-valuenow={temperature[0]}
                  aria-valuetext={`${temperature[0]} graus Celsius`}
                />
                <div className="flex justify-between text-xs text-muted-foreground" role="note">
                  <span>15°C - Frio</span>
                  <span>25°C - Ideal</span>
                  <span>40°C - Quente</span>
                </div>
              </fieldset>

              <Button 
                type="submit"
                variant="hero" 
                size="lg" 
                className="w-full h-16 text-lg font-semibold shadow-glow-primary rounded-xl"
                disabled={isAnalyzing}
                aria-label={isAnalyzing ? "Análise em andamento" : "Iniciar análise de probabilidades climáticas"}
              >
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                {isAnalyzing ? "Analisando..." : "Analisar Probabilidades Climáticas"}
              </Button>

              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2" role="status">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true"></span>
                Análise baseada em 20+ anos de dados históricos da NASA
              </p>
            </form>
          </Card>

          {/* Features */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-8 md:pt-12" aria-label="Principais recursos">
            <h2 className="sr-only">Recursos do WeatherWise</h2>
            <article className="text-center space-y-3 animate-fade-in glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary" aria-hidden="true">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Dados da NASA</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Décadas de observações precisas da Terra com dados validados cientificamente
              </p>
            </article>
            <article className="text-center space-y-3 animate-fade-in glass-effect p-6 rounded-2xl hover-lift" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-secondary" aria-hidden="true">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Análise Personalizada</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Índice de conforto baseado em suas preferências específicas
              </p>
            </article>
            <article className="text-center space-y-3 animate-fade-in glass-effect p-6 rounded-2xl hover-lift" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-accent" aria-hidden="true">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Datas Alternativas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sugestões inteligentes com melhores condições climáticas
              </p>
            </article>
          </section>
        </div>
      </main>

      {/* Query History Section */}
      {isLoggedIn && (
        <aside className="max-w-4xl mx-auto px-4 pb-8 md:pb-12" aria-label="Histórico de consultas">
          <h2 className="sr-only">Histórico de Consultas Anteriores</h2>
          <QueryHistoryList />
        </aside>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8 md:mt-20" role="contentinfo">
        <div className="container mx-auto px-4 py-6 md:py-8 text-center text-sm text-muted-foreground">
          <p>Desenvolvido para o NASA Space Apps Challenge 2025</p>
          <p className="mt-2">Dados fornecidos pela NASA Earth Observations</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
