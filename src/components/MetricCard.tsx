import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  iconColor: string;
}

export const MetricCard = ({ icon: Icon, title, value, description, iconColor }: MetricCardProps) => {
  return (
    <Card className="glass-effect-strong p-7 hover-lift transition-all duration-300 animate-scale-in rounded-2xl border-2">
      <article className="flex items-start gap-5">
        <div className={`p-4 rounded-2xl ${iconColor} bg-opacity-15 shadow-lg`} aria-hidden="true">
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{title}</h3>
          <p 
            className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
            aria-label={`${title}: ${value}`}
          >
            {value}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </article>
    </Card>
  );
};
