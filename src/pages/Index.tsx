import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Cloud, Calendar, Sparkles, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AboutDialog } from "@/components/AboutDialog";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { climateAnalysisSchema } from "@/lib/validations";

const Index = () => {
  const navigate = useNavigate();
  const [temperature, setTemperature] = useState([25]);
  const [userEmail, setUserEmail] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    // Validate inputs using Zod
    try {
      const validatedData = climateAnalysisSchema.parse({
        location: location,
        date: date,
        eventType: eventType,
        preferredTemperature: temperature[0]
      });

      setIsAnalyzing(true);
      
      console.log('Calling climate-analysis function...');
      
      const { data, error } = await supabase.functions.invoke('climate-analysis', {
        body: validatedData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Analysis result:', data);
      
      // Navigate to results page with the data
      navigate("/results", { state: { analysisData: data } });
      
    } catch (error: any) {
      console.error('Error:', error);
      
      // Handle Zod validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Erro ao analisar dados climáticos. Por favor, tente novamente.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 gradient-primary rounded-2xl shadow-glow-primary">
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              WeatherWise
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-muted-foreground hidden md:block glass-effect px-4 py-2 rounded-xl">
                  {userEmail}
                </span>
                <AboutDialog />
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl">
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <AboutDialog />
                <Button variant="hero" size="sm" onClick={() => navigate("/auth")} className="rounded-xl shadow-glow-primary">
                  Entrar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Text */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-effect rounded-full text-sm text-primary font-semibold mb-2 shadow-glow-primary">
              <Sparkles className="w-4 h-4 animate-float" />
              NASA Space Apps Challenge 2025
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Descubra as Probabilidades
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                Climáticas do Seu Evento
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Use décadas de dados de observação da Terra da NASA para planejar eventos, 
              atividades agrícolas e muito mais com <span className="font-semibold text-foreground">precisão sem precedentes.</span>
            </p>
          </div>

          {/* Search Form */}
          <Card className="glass-effect-strong p-10 shadow-2xl animate-slide-up hover-lift rounded-2xl border-2">
            <div className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold">
                  Localização do Evento
                </Label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  disabled={isAnalyzing}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-semibold">
                    Data do Evento
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10 h-12 text-base"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-type" className="text-base font-semibold">
                    Tipo de Evento
                  </Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="h-12 text-base">
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
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Faixa de Temperatura Confortável
                  </Label>
                  <span className="text-sm font-semibold text-primary">
                    {temperature[0]}°C
                  </span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={15}
                  max={40}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15°C - Frio</span>
                  <span>25°C - Ideal</span>
                  <span>40°C - Quente</span>
                </div>
              </div>

              <Button 
                variant="hero" 
                size="lg" 
                className="w-full h-16 text-lg font-semibold shadow-glow-primary rounded-xl"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                <Sparkles className="w-5 h-5" />
                {isAnalyzing ? "Analisando..." : "Analisar Probabilidades Climáticas"}
              </Button>

              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Análise baseada em 20+ anos de dados históricos da NASA
              </p>
            </div>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="text-center space-y-3 animate-fade-in glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Dados da NASA</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Décadas de observações precisas da Terra com dados validados cientificamente
              </p>
            </div>
            <div className="text-center space-y-3 animate-fade-in glass-effect p-6 rounded-2xl hover-lift" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-secondary">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Análise Personalizada</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Índice de conforto baseado em suas preferências específicas
              </p>
            </div>
            <div className="text-center space-y-3 animate-fade-in glass-effect p-6 rounded-2xl hover-lift" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-accent">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Datas Alternativas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sugestões inteligentes com melhores condições climáticas
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Desenvolvido para o NASA Space Apps Challenge 2025</p>
          <p className="mt-2">Dados fornecidos pela NASA Earth Observations</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
