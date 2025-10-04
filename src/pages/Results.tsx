import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { ComfortIndex } from "@/components/ComfortIndex";
import { AlternativeDate } from "@/components/AlternativeDate";
import { 
  Cloud, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  Sun, 
  TrendingUp, 
  ArrowLeft,
  Calendar
} from "lucide-react";

const Results = () => {
  const navigate = useNavigate();

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
          <Button variant="hero" size="sm">
            Nova Consulta
          </Button>
        </div>
      </header>

      {/* Results Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Event Info */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">São Paulo, SP • 15 de Junho de 2025 • Casamento</span>
            </div>
            <h1 className="text-4xl font-bold">Análise Climática Completa</h1>
          </div>

          {/* Comfort Index */}
          <div className="animate-slide-up">
            <ComfortIndex score={78} />
          </div>

          {/* Metrics Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Métricas Climáticas Detalhadas</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                icon={CloudRain}
                title="Probabilidade de Chuva"
                value="35%"
                description="Nos últimos 20 anos, choveu em 7 dos 20 dias nesta data"
                iconColor="text-primary"
              />
              <MetricCard
                icon={Thermometer}
                title="Temperatura Média"
                value="24°C"
                description="Variação: 20°C - 28°C"
                iconColor="text-warning"
              />
              <MetricCard
                icon={Wind}
                title="Velocidade do Vento"
                value="12 km/h"
                description="Vento moderado, condições normais"
                iconColor="text-secondary"
              />
              <MetricCard
                icon={Droplets}
                title="Umidade Relativa"
                value="68%"
                description="Umidade confortável"
                iconColor="text-accent"
              />
              <MetricCard
                icon={Cloud}
                title="Cobertura de Nuvens"
                value="45%"
                description="Parcialmente nublado"
                iconColor="text-muted-foreground"
              />
              <MetricCard
                icon={Sun}
                title="Eventos Extremos"
                value="5%"
                description="Baixa probabilidade de extremos"
                iconColor="text-warning"
              />
            </div>
          </div>

          {/* Alert */}
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
                  A probabilidade de chuva aumentou 12% na última década nesta região durante este período. 
                  Recomendamos fortemente considerar um plano B coberto ou datas alternativas.
                </p>
              </div>
            </div>
          </Card>

          {/* Alternative Dates */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Datas Alternativas Recomendadas</h2>
              <Button variant="ghost" size="sm">Ver Mais</Button>
            </div>
            <Card className="glass-effect p-6">
              <p className="text-muted-foreground mb-4">
                Baseado em dados históricos, estas datas têm melhores condições climáticas:
              </p>
              <div className="space-y-3">
                <AlternativeDate
                  date="08 de Junho de 2025"
                  rainProbability={20}
                  temperature={23}
                  icp={85}
                />
                <AlternativeDate
                  date="22 de Junho de 2025"
                  rainProbability={25}
                  temperature={22}
                  icp={82}
                />
                <AlternativeDate
                  date="29 de Junho de 2025"
                  rainProbability={28}
                  temperature={24}
                  icp={80}
                />
              </div>
            </Card>
          </div>

          {/* Data Source */}
          <div className="text-center py-8">
            <Card className="glass-effect inline-block px-8 py-4">
              <p className="text-sm text-muted-foreground">
                Análise baseada em dados históricos de 2000-2024
                <br />
                <span className="font-semibold text-foreground">NASA Earth Observations • POWER Data Access Viewer</span>
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
