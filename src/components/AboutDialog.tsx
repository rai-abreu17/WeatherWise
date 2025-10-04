import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud, Sparkles, Database, Calendar } from "lucide-react";

export const AboutDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Sobre</Button>
      </DialogTrigger>
      <DialogContent className="glass-effect max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl">WeatherWise Planner</DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-4 text-left">
            <p>
              <strong>WeatherWise Planner</strong> é uma aplicação desenvolvida para o{" "}
              <span className="text-primary font-semibold">NASA Space Apps Challenge 2025</span>,
              desafio "Will It Rain on My Parade?"
            </p>

            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                <div className="p-2 bg-primary/10 rounded-lg h-fit">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Dados da NASA</h4>
                  <p className="text-sm">
                    Utilizamos décadas de dados históricos de observação da Terra da NASA
                    para fornecer probabilidades climáticas precisas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg h-fit">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Análise Personalizada</h4>
                  <p className="text-sm">
                    Criamos o Índice de Conforto Pessoal (ICP) baseado em suas preferências
                    individuais de temperatura e tipo de evento.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-accent/10 rounded-lg h-fit">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Datas Alternativas</h4>
                  <p className="text-sm">
                    Sugestões inteligentes de datas com melhores condições climáticas
                    para o sucesso do seu evento.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-sm">
                <strong>Público-alvo:</strong> Organizadores de eventos, agricultores, 
                planejadores urbanos e qualquer pessoa que precise de previsões climáticas 
                confiáveis com meses de antecedência.
              </p>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Desenvolvido para o NASA Space Apps Challenge 2025
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
