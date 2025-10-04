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
    <Card className="glass-effect p-6 hover:shadow-xl transition-all duration-300 animate-scale-in">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${iconColor} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold mb-2">{value}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};
