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
    <Card className="glass-effect p-8 shadow-xl animate-slide-up">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Índice de Conforto Pessoal (ICP)</h2>
          <p className="text-muted-foreground">Baseado em suas preferências e dados históricos de 20 anos</p>
        </div>

        <div className="text-center py-6">
          <div className="text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {score}
          </div>
          <div className="text-2xl text-muted-foreground">/100</div>
        </div>

        <div className="relative h-6 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive via-warning to-success"></div>
          <div 
            className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
            style={{ left: `${score}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 rounded text-sm font-semibold whitespace-nowrap">
              {score}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">{getScoreLabel(score)}</p>
        </div>
      </div>
    </Card>
  );
};
