export type EventCategory = 'global' | 'regional' | 'local';
export type EventType = 'sports' | 'cultural' | 'religious' | 'festival' | 'holiday' | 'seasonal';

export interface Event {
  id: string;
  name: string;
  description?: string;
  category: EventCategory;
  event_type: EventType;
  start_date: string;
  end_date?: string;
  location_name: string;
  city?: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  icon_name?: string;
  color?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  popularity_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventWithWeather extends Event {
  weatherForecast?: {
    temperature: number;
    condition: string;
    precipitation: number;
    icp?: number;
  };
  distanceFromUser?: number;
  daysUntilEvent?: number;
  // Dados extras da Ticketmaster
  ticketmasterData?: {
    venue: string;
    estimatedAttendance: number;
    impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    priceRange?: {
      min: number;
      max: number;
      currency: string;
    };
    imageUrl?: string;
    url?: string;
  };
}

export interface SavedEvent {
  id: string;
  user_id: string;
  event_id: string;
  saved_at: string;
  notification_enabled: boolean;
}

export interface UserLocation {
  city?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface EventFilters {
  category?: EventCategory[];
  eventType?: EventType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  maxDistance?: number;
  onlySaved?: boolean;
}
