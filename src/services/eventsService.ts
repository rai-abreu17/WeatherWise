import { supabase } from '@/integrations/supabase/client';
import { Event, EventWithWeather, EventFilters, UserLocation, SavedEvent } from '@/types/events';

/**
 * Buscar eventos da Ticketmaster API
 */
export const getTicketmasterEvents = async (
  location: string,
  coordinates: { lat: number; lon: number },
  startDate: string,
  endDate?: string,
  radius: number = 50
): Promise<EventWithWeather[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-nearby-events', {
      body: {
        location,
        coordinates,
        startDate,
        endDate,
        radius
      }
    });

    if (error) {
      console.error('Error calling get-nearby-events function:', error);
      return [];
    }

    if (!data || !data.success) {
      console.error('Failed to fetch events:', data?.error);
      return [];
    }

    // Converter eventos da Ticketmaster para nosso formato
    return data.events.map((event: any) => ({
      id: event.id,
      name: event.name,
      description: `${event.type}${event.genre ? ' - ' + event.genre : ''}`,
      category: 'local' as const,
      event_type: mapEventType(event.type),
      start_date: event.date,
      end_date: event.date,
      location_name: `${event.venue}, ${event.city}`,
      city: event.city,
      country: 'Brasil',
      latitude: event.coordinates?.lat,
      longitude: event.coordinates?.lon,
      icon_name: getIconForEventType(event.type),
      color: getColorForEventType(event.type),
      is_recurring: false,
      popularity_score: Math.min(100, Math.floor(event.estimatedAttendance / 1000)),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      daysUntilEvent: calculateDaysUntilEvent(event.date),
      distanceFromUser: event.coordinates ? calculateDistance(
        coordinates.lat,
        coordinates.lon,
        event.coordinates.lat,
        event.coordinates.lon
      ) : undefined,
      // Dados extras da Ticketmaster
      ticketmasterData: {
        venue: event.venue,
        estimatedAttendance: event.estimatedAttendance,
        impactLevel: event.impactLevel,
        priceRange: event.priceRange,
        imageUrl: event.imageUrl,
        url: event.url
      }
    }));
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    return [];
  }
};

/**
 * Mapear tipo de evento da Ticketmaster para nosso sistema
 */
function mapEventType(ticketmasterType: string): 'sports' | 'cultural' | 'festival' | 'seasonal' {
  const typeMap: Record<string, any> = {
    'Sports': 'sports',
    'Music': 'festival',
    'Arts & Theatre': 'cultural',
    'Family': 'cultural',
    'Film': 'cultural',
    'Miscellaneous': 'seasonal'
  };
  
  return typeMap[ticketmasterType] || 'cultural';
}

/**
 * Obter ícone baseado no tipo de evento
 */
function getIconForEventType(type: string): string {
  const iconMap: Record<string, string> = {
    'Sports': 'Trophy',
    'Music': 'Music',
    'Arts & Theatre': 'Film',
    'Family': 'Heart',
    'Film': 'Film',
    'Miscellaneous': 'Calendar'
  };
  
  return iconMap[type] || 'Calendar';
}

/**
 * Obter cor baseada no tipo de evento
 */
function getColorForEventType(type: string): string {
  const colorMap: Record<string, string> = {
    'Sports': '#10B981', // Verde
    'Music': '#8B5CF6', // Roxo
    'Arts & Theatre': '#EC4899', // Rosa
    'Family': '#F59E0B', // Laranja
    'Film': '#3B82F6', // Azul
    'Miscellaneous': '#6B7280' // Cinza
  };
  
  return colorMap[type] || '#3B82F6';
}

/**
 * Calcular distância entre dois pontos usando fórmula de Haversine
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calcular dias até o evento
 */
export const calculateDaysUntilEvent = (eventDate: string): number => {
  const today = new Date();
  const event = new Date(eventDate);
  const diffTime = event.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Buscar eventos relevantes baseados na localização do usuário
 * NOTA: Esta função não é mais usada, pois os eventos agora vêm da API Nager.Date
 * Mantida apenas para compatibilidade com código existente
 */
export const getEventsByLocation = async (
  userLocation: UserLocation,
  filters?: EventFilters
): Promise<EventWithWeather[]> => {
  console.warn('getEventsByLocation is deprecated. Use Nager.Date API directly in EventsList component.');
  return [];
};

/**
 * Salvar evento favorito (usando localStorage)
 */
export const saveEvent = async (eventId: string): Promise<void> => {
  try {
    const savedEvents = getSavedEventsFromStorage();
    if (!savedEvents.includes(eventId)) {
      savedEvents.push(eventId);
      localStorage.setItem('savedEvents', JSON.stringify(savedEvents));
    }
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
};

/**
 * Obter eventos salvos do localStorage
 */
function getSavedEventsFromStorage(): string[] {
  try {
    const saved = localStorage.getItem('savedEvents');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading saved events:', error);
    return [];
  }
}

/**
 * Remover evento favorito (usando localStorage)
 */
export const unsaveEvent = async (eventId: string): Promise<void> => {
  try {
    const savedEvents = getSavedEventsFromStorage();
    const filtered = savedEvents.filter(id => id !== eventId);
    localStorage.setItem('savedEvents', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error unsaving event:', error);
    throw error;
  }
};

/**
 * Buscar eventos salvos pelo usuário (usando localStorage)
 */
export const getSavedEvents = async (): Promise<string[]> => {
  try {
    return getSavedEventsFromStorage();
  } catch (error) {
    console.error('Error fetching saved events:', error);
    return [];
  }
};

/**
 * Alternar notificações para um evento salvo (usando localStorage)
 */
export const toggleEventNotification = async (
  eventId: string,
  enabled: boolean
): Promise<void> => {
  try {
    const notifications = getNotificationsFromStorage();
    notifications[eventId] = enabled;
    localStorage.setItem('eventNotifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error toggling notification:', error);
    throw error;
  }
};

/**
 * Obter configurações de notificações do localStorage
 */
function getNotificationsFromStorage(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem('eventNotifications');
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error reading notifications:', error);
    return {};
  }
}
