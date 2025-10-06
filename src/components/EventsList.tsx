import { useState, useEffect } from 'react';
import { EventCard } from './EventCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  X,
  Loader2,
  MapPin
} from 'lucide-react';
import { EventWithWeather, EventFilters, UserLocation, EventCategory, EventType } from '@/types/events';
import { getSavedEvents, saveEvent, unsaveEvent, toggleEventNotification } from '@/services/eventsService';
import { toast } from 'sonner';

// Interface para feriados da API Nager.Date
interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Buscar feriados da API Nager.Date
const fetchHolidaysFromNagerAPI = async (year: number): Promise<NagerHoliday[]> => {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/BR`);
    if (!response.ok) {
      console.error('Erro ao buscar feriados da Nager API:', response.status);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar feriados:', error);
    return [];
  }
};

// Converter feriado para formato de evento
const convertHolidayToEvent = (holiday: NagerHoliday, userLocation: UserLocation | null): EventWithWeather => {
  return {
    id: `nager-${holiday.date}-${holiday.countryCode}`,
    name: holiday.localName,
    description: `Feriado nacional: ${holiday.name}`,
    category: 'global' as EventCategory,
    event_type: 'holiday' as EventType,
    start_date: holiday.date,
    end_date: holiday.date,
    location_name: 'Brasil',
    city: userLocation?.city || 'Brasil',
    state: userLocation?.state,
    country: 'BR',
    latitude: userLocation?.latitude || -15.7801,
    longitude: userLocation?.longitude || -47.9292,
    is_recurring: holiday.fixed,
    popularity_score: holiday.global ? 100 : 50,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ticketmasterData: {
      venue: 'Brasil',
      estimatedAttendance: 0,
      impactLevel: 'MEDIUM',
      imageUrl: getHolidayImage(holiday.localName),
      url: ''
    },
    distanceFromUser: 0,
    daysUntilEvent: Math.floor((new Date(holiday.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  };
};

// Obter imagem representativa para cada feriado
const getHolidayImage = (holidayName: string): string => {
  const name = holidayName.toLowerCase();
  
  if (name.includes('carnaval')) {
    return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80';
  } else if (name.includes('natal')) {
    return 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80';
  } else if (name.includes('ano novo') || name.includes('new year')) {
    return 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80';
  } else if (name.includes('páscoa') || name.includes('easter')) {
    return 'https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?w=800&q=80';
  } else if (name.includes('independência')) {
    return 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=800&q=80';
  } else if (name.includes('república')) {
    return 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=800&q=80';
  } else if (name.includes('aparecida')) {
    return 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=800&q=80';
  }
  
  // Imagem padrão para outros feriados
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';
};

interface EventsListProps {
  userLocation: UserLocation;
}

export const EventsList: React.FC<EventsListProps> = ({ userLocation }) => {
  const [events, setEvents] = useState<EventWithWeather[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const categoryOptions: { value: EventCategory; label: string }[] = [
    { value: 'global', label: 'Global' },
    { value: 'regional', label: 'Regional' },
    { value: 'local', label: 'Local' },
  ];

  const typeOptions: { value: EventType; label: string }[] = [
    { value: 'sports', label: 'Esportivo' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'religious', label: 'Religioso' },
    { value: 'festival', label: 'Festival' },
    { value: 'holiday', label: 'Feriado' },
    { value: 'seasonal', label: 'Sazonal' },
  ];

  useEffect(() => {
    loadEvents();
    loadSavedEvents();
  }, [userLocation]);

  useEffect(() => {
    loadEvents();
  }, [searchQuery, selectedCategories, selectedTypes]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Buscar feriados dos próximos 6 meses da API Nager.Date
      const today = new Date();
      const currentYear = today.getFullYear();
      const nextYear = currentYear + 1;
      
      // Buscar feriados do ano atual e próximo ano
      const [currentYearHolidays, nextYearHolidays] = await Promise.all([
        fetchHolidaysFromNagerAPI(currentYear),
        fetchHolidaysFromNagerAPI(nextYear)
      ]);
      
      const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
      
      // Filtrar apenas feriados dos próximos 6 meses
      const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
      const todayTime = today.getTime();
      
      const upcomingHolidays = allHolidays
        .filter(holiday => {
          const holidayTime = new Date(holiday.date).getTime();
          const diff = holidayTime - todayTime;
          return diff >= 0 && diff <= sixMonthsMs;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Converter feriados para formato de eventos
      const events = upcomingHolidays.map(holiday => convertHolidayToEvent(holiday, userLocation));
      
      let filteredEvents = [...events];

      // Aplicar filtro de categoria
      if (selectedCategories.length > 0) {
        filteredEvents = filteredEvents.filter(e => 
          selectedCategories.includes(e.category)
        );
      }

      // Aplicar filtro de tipo
      if (selectedTypes.length > 0) {
        filteredEvents = filteredEvents.filter(e => 
          selectedTypes.includes(e.event_type)
        );
      }

      // Aplicar busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(e =>
          e.name.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.location_name.toLowerCase().includes(query)
        );
      }

      // Ordenar por relevância (já vem ordenado por distância e data)
      setEvents(filteredEvents);
      
      if (filteredEvents.length > 0) {
        toast.success(`${filteredEvents.length} evento${filteredEvents.length > 1 ? 's' : ''} encontrado${filteredEvents.length > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erro ao carregar eventos');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedEvents = async () => {
    try {
      const saved = await getSavedEvents();
      setSavedEventIds(saved);
    } catch (error) {
      console.error('Error loading saved events:', error);
    }
  };

  const handleSaveEvent = async (eventId: string) => {
    try {
      await saveEvent(eventId);
      setSavedEventIds([...savedEventIds, eventId]);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erro ao salvar evento. Faça login para salvar favoritos.');
    }
  };

  const handleUnsaveEvent = async (eventId: string) => {
    try {
      await unsaveEvent(eventId);
      setSavedEventIds(savedEventIds.filter(id => id !== eventId));
    } catch (error) {
      console.error('Error unsaving event:', error);
      toast.error('Erro ao remover evento dos favoritos');
    }
  };

  const handleToggleNotification = async (eventId: string, enabled: boolean) => {
    try {
      await toggleEventNotification(eventId, enabled);
    } catch (error) {
      console.error('Error toggling notification:', error);
      toast.error('Erro ao configurar notificação');
    }
  };

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleType = (type: EventType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedTypes([]);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || selectedTypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Eventos Próximos
          </h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {userLocation.city ? `${userLocation.city}, ${userLocation.state}` : userLocation.country}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="default" className="ml-1 px-1.5 py-0.5 text-xs">
              {(selectedCategories.length + selectedTypes.length + (searchQuery ? 1 : 0))}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos por nome ou localização..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 glass-effect-strong rounded-lg space-y-4 animate-slide-up">
            {/* Category Filters */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={selectedCategories.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => toggleCategory(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Tipo de Evento</label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={selectedTypes.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => toggleType(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando eventos...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 glass-effect-strong rounded-lg">
          <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum evento encontrado</h3>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? 'Tente ajustar os filtros ou fazer uma nova busca'
              : 'Não há eventos disponíveis para sua localização no momento'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSaved={savedEventIds.includes(event.id)}
              onSave={handleSaveEvent}
              onUnsave={handleUnsaveEvent}
              onToggleNotification={handleToggleNotification}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && events.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {events.length} evento{events.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
