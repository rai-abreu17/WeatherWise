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
    <Card className="glass-effect-strong p-8 md:p-10 shadow-2xl animate-slide-up rounded-3xl border-2 border-primary/20 hover-lift">
      <div className="space-y-6 md:space-y-8" role="region" aria-label="Índice de Conforto Pessoal">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Índice de Conforto Pessoal (ICP)
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">Baseado em suas preferências e dados históricos de 20 anos</p>
        </div>

        <div className="text-center py-6 md:py-8">
          <div className="relative inline-block">
            <div 
              className="text-7xl sm:text-8xl md:text-9xl font-black bg-gradient-to-br from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent mb-3 animate-scale-in leading-none drop-shadow-2xl"
              aria-label={`Pontuação do ICP: ${score} de 100`}
            >
              {score}
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-glow-primary" aria-hidden="true"></div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-muted-foreground" aria-hidden="true">/100</div>
        </div>

        {/* Barra de progresso com glow */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-r from-orange-500 via-yellow-500 via-green-500 to-green-600 rounded-full" aria-hidden="true"></div>
          
          {/* Barra */}
          <div 
            className="relative h-3 md:h-4 bg-muted rounded-full overflow-hidden shadow-inner"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Indicador visual do ICP"
          >
            <div 
              className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 via-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${score}%` }}
              aria-hidden="true"
            ></div>
          </div>
        </div>

        <div className="text-center glass-effect p-4 md:p-5 rounded-2xl" role="status" aria-live="polite">
          <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {getScoreLabel(score)}
          </p>
        </div>
      </div>
    </Card>
  );
};
