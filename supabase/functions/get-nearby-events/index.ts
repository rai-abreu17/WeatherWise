import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventRequest {
  location: string;
  coordinates: { lat: number; lon: number };
  startDate: string;
  endDate?: string;
  radius?: number;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues: Array<{
      name: string;
      city: { name: string };
      location: { longitude: string; latitude: string };
    }>;
  };
  classifications?: Array<{
    segment: { name: string };
    genre?: { name: string };
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

// Estimar público baseado no tipo de evento e local
function estimateAttendance(event: TicketmasterEvent): number {
  const venueName = event._embedded?.venues[0]?.name?.toLowerCase() || '';
  const type = event.classifications?.[0]?.segment?.name || '';
  
  // Grandes estádios
  if (venueName.includes('maracanã') || venueName.includes('morumbi')) return 60000;
  if (venueName.includes('castelão') || venueName.includes('mineirão')) return 50000;
  if (venueName.includes('arena') || venueName.includes('allianz')) return 40000;
  
  // Por tipo de evento
  if (type === 'Sports') return 30000;
  if (type === 'Music') return 15000;
  if (type === 'Arts & Theatre') return 2000;
  
  return 5000; // Padrão
}

// Calcular impacto do evento
function calculateImpact(event: TicketmasterEvent, attendance: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (attendance > 30000) return 'HIGH';
  if (attendance > 10000) return 'MEDIUM';
  return 'LOW';
}

// Gerar warnings baseado em eventos e clima
function generateEventWarnings(
  events: any[],
  rainProbability: number,
  temperature: number
): Array<{ type: string; severity: string; message: string }> {
  const warnings = [];
  
  events.forEach(event => {
    // Evento grande + chuva
    if (event.impactLevel === 'HIGH' && rainProbability > 50) {
      warnings.push({
        type: 'traffic_rain',
        severity: 'high',
        message: `${event.name} + ${rainProbability}% de chance de chuva podem causar congestionamentos severos. Planeje rotas alternativas.`
      });
    }
    
    // Evento grande + temperatura extrema
    if (event.impactLevel === 'HIGH' && (temperature > 35 || temperature < 15)) {
      warnings.push({
        type: 'weather_extreme',
        severity: 'medium',
        message: `${event.name} com temperatura ${temperature > 35 ? 'muito alta' : 'baixa'}. Prepare-se adequadamente.`
      });
    }
    
    // Alta ocupação
    if (event.estimatedAttendance > 30000) {
      warnings.push({
        type: 'high_attendance',
        severity: 'medium',
        message: `${event.name} com ${event.estimatedAttendance.toLocaleString('pt-BR')} pessoas esperadas. Reserve hotéis e transporte com antecedência.`
      });
    }
    
    // Evento ao ar livre + chuva
    if (event.venue?.toLowerCase().includes('estádio') && rainProbability > 30) {
      warnings.push({
        type: 'outdoor_rain',
        severity: 'medium',
        message: `Evento ao ar livre em ${event.venue} com ${rainProbability}% de chance de chuva. Leve proteção.`
      });
    }
  });
  
  return warnings;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { location, coordinates, startDate, endDate, radius = 50 }: EventRequest = await req.json()
    
    const TICKETMASTER_KEY = 'exHevsA07dUkhCssZmXGpjyTovcYsmiO';
    
    // Calcular endDate se não fornecido (3 dias depois)
    const end = endDate || new Date(new Date(startDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Buscar eventos no raio especificado
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', TICKETMASTER_KEY);
    url.searchParams.set('latlong', `${coordinates.lat},${coordinates.lon}`);
    url.searchParams.set('radius', radius.toString());
    url.searchParams.set('unit', 'km');
    url.searchParams.set('startDateTime', `${startDate}T00:00:00Z`);
    url.searchParams.set('endDateTime', `${end}T23:59:59Z`);
    url.searchParams.set('size', '50');
    url.searchParams.set('countryCode', 'BR');
    url.searchParams.set('locale', 'pt-br');
    
    console.log('Fetching events from Ticketmaster:', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Processar eventos
    const events = data._embedded?.events?.map((event: TicketmasterEvent) => {
      const venue = event._embedded?.venues?.[0];
      const attendance = estimateAttendance(event);
      const impact = calculateImpact(event, attendance);
      const classification = event.classifications?.[0];
      const priceRange = event.priceRanges?.[0];
      const image = event.images?.find(img => img.width >= 640 && img.width <= 1024);
      
      return {
        id: event.id,
        name: event.name,
        date: event.dates.start.localDate,
        time: event.dates.start.localTime,
        venue: venue?.name || 'Local não especificado',
        city: venue?.city?.name || location,
        coordinates: venue?.location ? {
          lat: parseFloat(venue.location.latitude),
          lon: parseFloat(venue.location.longitude)
        } : coordinates,
        type: classification?.segment?.name || 'Event',
        genre: classification?.genre?.name,
        estimatedAttendance: attendance,
        impactLevel: impact,
        priceRange: priceRange ? {
          min: priceRange.min,
          max: priceRange.max,
          currency: priceRange.currency
        } : null,
        imageUrl: image?.url,
        url: `https://www.ticketmaster.com.br/event/${event.id}`
      };
    }) || [];
    
    console.log(`Found ${events.length} events`);
    
    return new Response(
      JSON.stringify({
        success: true,
        count: events.length,
        events,
        metadata: {
          location,
          coordinates,
          dateRange: { start: startDate, end },
          radius,
          source: 'Ticketmaster Discovery API'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching events:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        events: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to avoid breaking the client
      }
    )
  }
})
