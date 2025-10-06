// Mock data de eventos para testar a interface sem o banco de dados
import { EventWithWeather } from '@/types/events';

export const mockEvents: EventWithWeather[] = [
  {
    id: '1',
    name: 'Carnaval 2026',
    description: 'Maior festa popular do Brasil com blocos de rua e desfiles',
    category: 'regional',
    event_type: 'festival',
    start_date: '2026-02-14',
    end_date: '2026-02-17',
    location_name: 'Brasil',
    country: 'Brasil',
    icon_name: 'Music',
    color: '#9333EA',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    popularity_score: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daysUntilEvent: 132,
  },
  {
    id: '2',
    name: 'São João de Campina Grande',
    description: 'O Maior São João do Mundo',
    category: 'local',
    event_type: 'cultural',
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    location_name: 'Campina Grande, Paraíba',
    city: 'Campina Grande',
    state: 'Paraíba',
    country: 'Brasil',
    latitude: -7.2306,
    longitude: -35.8811,
    icon_name: 'Flame',
    color: '#F59E0B',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    popularity_score: 95,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daysUntilEvent: 239,
  },
  {
    id: '3',
    name: 'Copa do Mundo FIFA 2026',
    description: 'Mundial de futebol sediado em América do Norte',
    category: 'global',
    event_type: 'sports',
    start_date: '2026-06-11',
    end_date: '2026-07-19',
    location_name: 'América do Norte',
    country: 'EUA/Canadá/México',
    icon_name: 'Trophy',
    color: '#FFD700',
    is_recurring: false,
    popularity_score: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daysUntilEvent: 249,
  },
  {
    id: '4',
    name: 'Oktoberfest Blumenau',
    description: 'Festival de cerveja típico alemão',
    category: 'regional',
    event_type: 'festival',
    start_date: '2025-10-08',
    end_date: '2025-10-26',
    location_name: 'Blumenau, Santa Catarina',
    city: 'Blumenau',
    state: 'Santa Catarina',
    country: 'Brasil',
    latitude: -26.9194,
    longitude: -49.0661,
    icon_name: 'Music',
    color: '#F97316',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    popularity_score: 90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daysUntilEvent: 3,
  },
  {
    id: '5',
    name: 'Natal',
    description: 'Celebração natalina mundial',
    category: 'global',
    event_type: 'religious',
    start_date: '2025-12-25',
    end_date: '2025-12-25',
    location_name: 'Mundial',
    country: 'Mundial',
    icon_name: 'Gift',
    color: '#DC2626',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    popularity_score: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daysUntilEvent: 81,
  },
  {
    id: '6',
    name: 'Réveillon de Copacabana',
    description: 'Maior festa de réveillon do Brasil',
    category: 'local',
    event_type: 'festival',
    start_date: '2025-12-31',
    end_date: '2026-01-01',
    location_name: 'Rio de Janeiro',
    city: 'Rio de Janeiro',
    state: 'Rio de Janeiro',
    country: 'Brasil',
    latitude: -22.9706,
    longitude: -43.1825,
    icon_name: 'Sparkles',
    color: '#FFD700',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    popularity_score: 98,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daysUntilEvent: 87,
  },
];

// Função para calcular distância entre duas coordenadas (Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Função para obter eventos mockados com distância calculada
export function getMockEvents(userLocation: { latitude: number; longitude: number }) {
  return mockEvents.map(event => {
    if (event.latitude && event.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.latitude,
        event.longitude
      );
      return {
        ...event,
        distanceFromUser: distance
      };
    }
    return event;
  }).sort((a, b) => {
    // Ordenar por distância (eventos sem coordenadas vão para o final)
    if (!a.distanceFromUser) return 1;
    if (!b.distanceFromUser) return -1;
    return a.distanceFromUser - b.distanceFromUser;
  });
}
