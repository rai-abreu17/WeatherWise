import { Card } from "@/components/ui/card";

interface ComfortIndexProps {
  score: number;
}

export const ComfortIndex = ({ score }: ComfortIndexProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Muito Bom - Condições Favoráveis para o Evento";
    if (score >= 60) return "Bom - Condições Aceitáveis";
    return "Regular - Considere Alternativas";
  };

  return (
    <Card className="glass-effect-strong p-10 shadow-2xl animate-slide-up rounded-3xl border-2 hover-lift">
      <div className="space-y-8" role="region" aria-label="Índice de Conforto Pessoal">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Índice de Conforto Pessoal (ICP)
          </h2>
          <p className="text-muted-foreground text-lg">Baseado em suas preferências e dados históricos de 20 anos</p>
        </div>

        <div className="text-center py-8">
          <div className="relative inline-block">
            <div 
              className="text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3 animate-scale-in"
              aria-label={`Pontuação do ICP: ${score} de 100`}
            >
              {score}
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-glow-primary" aria-hidden="true"></div>
          </div>
          <div className="text-3xl font-bold text-muted-foreground" aria-hidden="true">/100</div>
        </div>

        <div 
          className="relative h-8 bg-muted rounded-full overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Indicador visual do ICP"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-destructive via-warning to-success" aria-hidden="true"></div>
          <div 
            className="absolute top-0 bottom-0 w-2 bg-foreground shadow-xl rounded-full transition-all duration-500"
            style={{ left: `calc(${score}% - 4px)` }}
            aria-hidden="true"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-effect-strong px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shadow-lg">
              {score}
            </div>
          </div>
        </div>

        <div className="text-center glass-effect p-4 rounded-2xl" role="status" aria-live="polite">
          <p className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {getScoreLabel(score)}
          </p>
        </div>
      </div>
    </Card>
  );
};
