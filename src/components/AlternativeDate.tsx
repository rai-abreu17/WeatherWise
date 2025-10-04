import { Card } from "@/components/ui/card";
import { Calendar, CloudRain, Thermometer } from "lucide-react";

interface AlternativeDateProps {
  date: string;
  rainProbability: number;
  temperature: number;
  icp: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const AlternativeDate = ({ date, rainProbability, temperature, icp, isSelected, onClick }: AlternativeDateProps) => {
  const getICPColor = (icp: number) => {
    if (icp >= 80) return "text-success";
    if (icp >= 60) return "text-warning";
    return "text-destructive";
  };

  const getICPLabel = (icp: number) => {
    if (icp >= 80) return "Excelente";
    if (icp >= 60) return "Bom";
    return "Regular";
  };

  return (
    <Card 
      className={`glass-effect p-5 hover:shadow-lg transition-all cursor-pointer group ${
        isSelected ? "ring-2 ring-primary shadow-glow" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg mb-2">{date}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CloudRain className="w-4 h-4" />
                <span>{rainProbability}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Thermometer className="w-4 h-4" />
                <span>{temperature}°C</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">ICP</p>
          <p className={`text-2xl font-bold ${getICPColor(icp)}`}>{icp}</p>
          <p className={`text-xs font-medium ${getICPColor(icp)}`}>{getICPLabel(icp)}</p>
        </div>
      </div>
    </Card>
  );
};
