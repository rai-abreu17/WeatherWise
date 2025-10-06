import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Heart, 
  Sparkles, 
  CloudRain,
  Thermometer,
  Bell,
  BellOff,
  Share2,
  Trophy,
  Music,
  Church,
  Flame,
  Gift,
  Film
} from 'lucide-react';
import { EventWithWeather } from '@/types/events';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Mapeamento de ícones
const iconMap: Record<string, any> = {
  Calendar,
  Trophy,
  Music,
  Church,
  Flame,
  Gift,
  Film,
  Heart,
  Sparkles,
};

interface EventCardProps {
  event: EventWithWeather;
  isSaved: boolean;
  onSave: (eventId: string) => void;
  onUnsave: (eventId: string) => void;
  onToggleNotification?: (eventId: string, enabled: boolean) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSaved,
  onSave,
  onUnsave,
  onToggleNotification,
}) => {
  const navigate = useNavigate();
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const IconComponent = event.icon_name && iconMap[event.icon_name] 
    ? iconMap[event.icon_name] 
    : Calendar;

  const categoryColors = {
    global: 'from-blue-500 to-purple-500',
    regional: 'from-orange-500 to-pink-500',
    local: 'from-green-500 to-teal-500',
  };

  const categoryLabels = {
    global: 'Global',
    regional: 'Regional',
    local: 'Local',
  };

  const typeLabels = {
    sports: 'Esportivo',
    cultural: 'Cultural',
    religious: 'Religioso',
    festival: 'Festival',
    holiday: 'Feriado',
    seasonal: 'Sazonal',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    if (event.end_date && event.end_date !== event.start_date) {
      return `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`;
    }
    return formatDate(event.start_date);
  };

  const handlePlan = () => {
    // Navegar para a página de resultados com dados do evento
    navigate('/results', {
      state: {
        eventMode: true,
        eventData: {
          name: event.name,
          startDate: event.start_date,
          endDate: event.end_date,
          defaultLocation: {
            name: event.location_name,
            latitude: event.latitude,
            longitude: event.longitude,
          },
          category: event.category,
          eventType: event.event_type,
        },
      },
    });
    
    toast.success(`Planejando ${event.name}...`);
  };

  const handleSave = () => {
    if (isSaved) {
      onUnsave(event.id);
      toast.success('Evento removido dos favoritos');
    } else {
      onSave(event.id);
      toast.success('Evento salvo nos favoritos!');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event.name,
      text: `Confira o evento ${event.name} em ${event.location_name}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title} - ${shareData.text} ${shareData.url}`
        );
        toast.success('Link copiado para área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleToggleNotification = () => {
    const newState = !notificationEnabled;
    setNotificationEnabled(newState);
    if (onToggleNotification) {
      onToggleNotification(event.id, newState);
    }
    toast.success(
      newState 
        ? 'Notificações ativadas para este evento' 
        : 'Notificações desativadas'
    );
  };

  const getProximityBadge = () => {
    if (!event.daysUntilEvent) return null;

    if (event.daysUntilEvent < 0) {
      return <Badge variant="secondary">Evento passado</Badge>;
    } else if (event.daysUntilEvent === 0) {
      return <Badge variant="default" className="bg-red-500 animate-pulse">Hoje!</Badge>;
    } else if (event.daysUntilEvent <= 7) {
      return <Badge variant="default" className="bg-orange-500">Em {event.daysUntilEvent} dia{event.daysUntilEvent > 1 ? 's' : ''}</Badge>;
    } else if (event.daysUntilEvent <= 30) {
      return <Badge variant="default" className="bg-blue-500">Em {event.daysUntilEvent} dias</Badge>;
    }
    return <Badge variant="outline">{event.daysUntilEvent} dias</Badge>;
  };

  return (
    <Card className="glass-effect-strong hover-lift overflow-hidden group h-full flex flex-col">
      {/* Header com gradiente */}
      <div className={`h-2 bg-gradient-to-r ${categoryColors[event.category]}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg shadow-lg"
              style={{ backgroundColor: event.color || '#3b82f6' }}
            >
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <Badge variant="secondary" className="text-xs">
                {categoryLabels[event.category]}
              </Badge>
              <Badge variant="outline" className="text-xs ml-1">
                {typeLabels[event.event_type]}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
          >
            <Heart
              className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
            />
          </Button>
        </div>

        <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {event.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Data */}
          <div className="flex items-start gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{formatDateRange()}</p>
              {getProximityBadge()}
            </div>
          </div>

          {/* Localização */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium line-clamp-1">{event.location_name}</p>
              {event.distanceFromUser && (
                <p className="text-xs text-muted-foreground">
                  {event.distanceFromUser < 1
                    ? `${(event.distanceFromUser * 1000).toFixed(0)}m de você`
                    : `${event.distanceFromUser.toFixed(1)}km de você`}
                </p>
              )}
            </div>
          </div>

          {/* Previsão do Tempo */}
          {event.weatherForecast ? (
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Previsão Climática</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {event.weatherForecast.temperature}°C
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {event.weatherForecast.precipitation}%
                  </span>
                </div>
              </div>
              {event.weatherForecast.icp && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Índice de Conforto</span>
                  <Badge variant={event.weatherForecast.icp >= 70 ? 'default' : 'secondary'}>
                    {event.weatherForecast.icp}%
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/10 rounded-lg border border-dashed border-border">
              <p className="text-xs text-muted-foreground text-center">
                Previsão disponível 14 dias antes do evento
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="hero"
            className="flex-1 shadow-glow-primary"
            onClick={handlePlan}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Planejar
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          {isSaved && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleNotification}
              title={notificationEnabled ? 'Desativar notificações' : 'Ativar notificações'}
            >
              {notificationEnabled ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
