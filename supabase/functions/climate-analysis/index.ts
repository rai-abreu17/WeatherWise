import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=300', // Cache 5 minutos
};

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface EventTimeData {
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
}

interface ClimateRequest {
  location?: string; // Compatibilidade com formato antigo
  locations?: Location[]; // Novo formato para múltiplas localizações
  date: string;
  eventType: string;
  preferredTemperature: number;
  eventTime?: EventTimeData; // Dados de horário do evento
}

interface ClimateData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, locations, date, eventType, preferredTemperature, eventTime }: ClimateRequest = await req.json();
    
    console.log('Received request:', { 
      hasLocation: !!location, 
      hasLocations: !!locations, 
      locationsCount: locations?.length,
      date, 
      eventType,
      hasEventTime: !!eventTime
    });
    
    const NASA_API_KEY = Deno.env.get('NASA_API_KEY');
    if (!NASA_API_KEY) {
      console.error('NASA_API_KEY is not configured in environment variables');
      throw new Error('NASA_API_KEY not configured. Please add it to Supabase Edge Function secrets.');
    }

    // Determinar se é single ou múltiplas localizações
    let locationsToProcess: Location[] = [];
    
    if (locations && Array.isArray(locations) && locations.length > 0) {
      // Novo formato: múltiplas localizações
      console.log('Processing multiple locations:', locations.length);
      locationsToProcess = locations;
    } else if (location) {
      // Formato antigo: localização única (compatibilidade)
      console.log('Processing single location (legacy format):', location);
      const coordinates = await geocodeLocation(location);
      locationsToProcess = [{
        name: location,
        latitude: coordinates.lat,
        longitude: coordinates.lon
      }];
    } else {
      console.error('No location provided in request');
      throw new Error('Nenhuma localização fornecida. Use "location" ou "locations".');
    }

    // Processar todas as localizações em paralelo
    const analysisPromises = locationsToProcess.map(loc => 
      processLocation(loc, date, eventType, preferredTemperature, NASA_API_KEY, eventTime)
    );
    
    const allResults = await Promise.all(analysisPromises);
    
    // Se foi formato antigo (single location), retornar objeto único
    // Se foi formato novo (múltiplas), retornar array
    const response = (location && !locations) ? allResults[0] : allResults;



    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in climate-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : null
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============= NAGER.DATE API INTEGRATION =============

/**
 * Buscar feriados do ano com cache no banco de dados
 */
async function fetchHolidaysWithCache(
  year: number,
  countryCode: string = 'BR'
): Promise<any[]> {
  try {
    // 1. Tentar buscar do cache usando fetch para Supabase REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured for holidays cache');
      return await fetchHolidaysFromAPI(year, countryCode);
    }

    const cacheUrl = `${supabaseUrl}/rest/v1/holidays_cache?country_code=eq.${countryCode}&year=eq.${year}&select=*`;
    const cacheResponse = await fetch(cacheUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    if (cacheResponse.ok) {
      const cached = await cacheResponse.json();
      if (cached && cached.length > 0) {
        console.log(`✅ Using cached holidays for ${countryCode} ${year} (${cached.length} holidays)`);
        return cached;
      }
    }

    // 2. Se não tem cache, buscar da API Nager.Date
    console.log(`🌐 Fetching holidays from Nager.Date API for ${countryCode} ${year}`);
    const holidays = await fetchHolidaysFromAPI(year, countryCode);

    // 3. Salvar no cache
    if (holidays.length > 0) {
      const holidaysToCache = holidays.map((h: any) => ({
        country_code: countryCode,
        year: year,
        holiday_date: h.date,
        local_name: h.localName,
        name_en: h.name,
        is_global: h.global,
        holiday_types: h.types || ['Public']
      }));

      try {
        await fetch(`${supabaseUrl}/rest/v1/holidays_cache`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(holidaysToCache)
        });
        console.log(`💾 Cached ${holidaysToCache.length} holidays for ${countryCode} ${year}`);
      } catch (cacheError) {
        console.warn('Failed to cache holidays:', cacheError);
      }
    }

    return holidays;
  } catch (error) {
    console.error('Error in fetchHolidaysWithCache:', error);
    return [];
  }
}

/**
 * Buscar feriados diretamente da API Nager.Date
 */
async function fetchHolidaysFromAPI(year: number, countryCode: string): Promise<any[]> {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Nager.Date API error: ${response.status}`);
      return [];
    }

    const holidays = await response.json();
    return holidays;
  } catch (error) {
    console.error('Failed to fetch holidays from Nager.Date API:', error);
    return [];
  }
}

/**
 * Buscar feriados próximos (próximos 6 meses a partir da data alvo)
 */
async function findNearbyHolidays(
  targetDate: string,
  countryCode: string = 'BR'
): Promise<any[]> {
  try {
    const date = new Date(targetDate);
    const year = date.getFullYear();
    const nextYear = year + 1;
    
    // Buscar feriados do ano atual e próximo ano (para cobrir 6 meses)
    const [currentYearHolidays, nextYearHolidays] = await Promise.all([
      fetchHolidaysWithCache(year, countryCode),
      fetchHolidaysWithCache(nextYear, countryCode)
    ]);
    
    const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
    
    if (allHolidays.length === 0) {
      return [];
    }
    
    // Filtrar feriados dos próximos 6 meses
    const targetTime = date.getTime();
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000; // Aproximadamente 6 meses
    
    return allHolidays
      .map((holiday: any) => {
        const holidayDate = holiday.holiday_date || holiday.date;
        const holidayTime = new Date(holidayDate).getTime();
        const diff = holidayTime - targetTime;
        const daysFromTarget = Math.round(diff / (24 * 60 * 60 * 1000));
        
        return {
          date: holidayDate,
          name: holiday.local_name || holiday.localName,
          nameEn: holiday.name_en || holiday.name,
          isGlobal: holiday.is_global !== undefined ? holiday.is_global : holiday.global,
          types: holiday.holiday_types || holiday.types || [],
          daysFromTarget: daysFromTarget,
          diff: diff
        };
      })
      .filter((h: any) => h.diff >= 0 && h.diff <= sixMonthsMs) // Apenas feriados futuros nos próximos 6 meses
      .sort((a: any, b: any) => a.diff - b.diff);
  } catch (error) {
    console.error('Error in findNearbyHolidays:', error);
    return [];
  }
}

/**
 * Gerar mensagens contextuais sobre feriados
 */
function generateHolidayMessages(
  nearbyHolidays: any[],
  climateStats: any
): string[] {
  const messages: string[] = [];
  
  nearbyHolidays.forEach(holiday => {
    const daysText = holiday.daysFromTarget === 0 
      ? 'no mesmo dia' 
      : `em ${holiday.daysFromTarget} dia${holiday.daysFromTarget > 1 ? 's' : ''}`;
    
    // Mensagem básica
    messages.push(`📅 ${holiday.name} acontece ${daysText}`);
    
    // Alertas específicos para feriados muito próximos (até 14 dias)
    if (holiday.daysFromTarget <= 14) {
      // Feriados nacionais importantes
      const majorHolidays = ['Natal', 'Ano Novo', 'Páscoa', 'Independência', 'Proclamação da República', 'Carnaval'];
      const isMajorHoliday = majorHolidays.some(h => holiday.name.includes(h));
      
      if (isMajorHoliday && holiday.isGlobal) {
        messages.push('⚠️ Feriado nacional - comércio fechado, trânsito reduzido, alta demanda por serviços');
      }
      
      // Alertas climáticos para feriados próximos (até 7 dias)
      if (holiday.daysFromTarget <= 7) {
        if (climateStats.rainProbability > 60) {
          messages.push(`🌧️ Feriado + ${climateStats.rainProbability}% de chance de chuva - planeje atividades cobertas`);
        } else if (climateStats.rainProbability < 20 && climateStats.avgTemperature > 20 && climateStats.avgTemperature < 30) {
          messages.push(`✅ Condições climáticas excelentes para aproveitar o feriado ao ar livre (${Math.round(climateStats.avgTemperature)}°C)`);
        }
        
        // Alertas de temperatura extrema
        if (climateStats.avgTemperature > 35) {
          messages.push(`🌡️ Calor intenso previsto (${Math.round(climateStats.avgTemperature)}°C) - hidrate-se e evite sol forte`);
        }
      }
      
      // Carnaval
      if (holiday.name.includes('Carnaval')) {
        messages.push('🎭 Carnaval - espere grande movimento, blocos de rua e festas');
      }
    }
  });
  
  return messages;
}

// ============= END NAGER.DATE INTEGRATION =============

// Process a single location
async function processLocation(
  location: Location,
  date: string,
  eventType: string,
  preferredTemperature: number,
  apiKey: string,
  eventTime?: EventTimeData
) {
  try {
    console.log(`⚡ Processing location: ${location.name}`);
    const processingStartTime = performance.now();
    const performanceMetrics: any = {};
    
    // Use coordinates directly from the location object
    const coordinates = {
      lat: location.latitude,
      lon: location.longitude
    };
    
    console.log('Coordinates:', coordinates);

    // Fetch historical climate data from NASA POWER API
    const t1 = performance.now();
    const historicalData = await fetchHistoricalData(
      coordinates.lat,
      coordinates.lon,
      date,
      apiKey
    );
    performanceMetrics.fetchHistoricalData = (performance.now() - t1).toFixed(0);
    console.log(`✅ Fetched historical data in ${performanceMetrics.fetchHistoricalData}ms`);

    // Calculate statistics and probabilities
    const t2 = performance.now();
    const statistics = calculateStatistics(historicalData);
    performanceMetrics.calculateStatistics = (performance.now() - t2).toFixed(0);
    
    // Calculate Personal Comfort Index (ICP)
    const icp = calculateICP(statistics, preferredTemperature, eventType);
    
    // Detect climate trends
    const trend = detectTrend(historicalData);
    performanceMetrics.calculations = (performance.now() - t2).toFixed(0);
    console.log(`✅ Calculations completed in ${performanceMetrics.calculations}ms`);
    
    // 🚀 OTIMIZAÇÃO: Buscar feriados, datas alternativas e análise horária em PARALELO
    const t3 = performance.now();
    console.log('⚡ Starting parallel requests (holidays + alternatives + hourly)...');
    
    const parallelPromises: any = {
      holidays: findNearbyHolidays(date, 'BR'),
      alternativeDates: suggestAlternativeDates(
        coordinates.lat,
        coordinates.lon,
        date,
        preferredTemperature,
        eventType,
        apiKey
      )
    };
    
    // Adicionar análise horária se fornecido
    if (eventTime && !eventTime.isAllDay && eventTime.startTime) {
      parallelPromises.hourlyAnalysis = (async () => {
        try {
          const hourlyForecast = await generateHourlyForecast(
            coordinates.lat,
            coordinates.lon,
            date,
            statistics
          );
          
          const startHour = parseInt(eventTime.startTime.split(':')[0]);
          const endHour = eventTime.endTime 
            ? parseInt(eventTime.endTime.split(':')[0]) 
            : startHour + 2;
          
          const analysis = analyzeTimeSlot(hourlyForecast, startHour, endHour);
          const recommended = findOptimalTimeSlots(hourlyForecast, startHour, endHour);
          
          return { analysis, recommended };
        } catch (error) {
          console.error('Error in hourly analysis:', error);
          return { analysis: null, recommended: [] };
        }
      })();
    }
    
    // Aguardar todas as requisições paralelas
    const parallelResults = await Promise.all([
      parallelPromises.holidays,
      parallelPromises.alternativeDates,
      parallelPromises.hourlyAnalysis || Promise.resolve({ analysis: null, recommended: [] })
    ]);
    
    const [nearbyHolidays, alternativeDates, hourlyResult] = parallelResults;
    const holidayMessages = generateHolidayMessages(nearbyHolidays, statistics);
    
    performanceMetrics.parallelRequests = (performance.now() - t3).toFixed(0);
    console.log(`✅ Parallel requests completed in ${performanceMetrics.parallelRequests}ms`);
    
    const totalTime = (performance.now() - processingStartTime).toFixed(0);
    performanceMetrics.total = totalTime;
    console.log(`🎯 Total processing time: ${totalTime}ms`);
    console.log(`Found ${nearbyHolidays.length} holidays in the next 6 months from ${date}`);

    // Format response
    return {
      location: {
        name: location.name,
        latitude: coordinates.lat,
        longitude: coordinates.lon
      },
      requestedDate: {
        date: date,
        displayDate: formatDate(date),
        icp: icp,
        rainProbability: statistics.rainProbability,
        temperature: statistics.avgTemperature,
        temperatureRange: `${statistics.minTemperature}°C - ${statistics.maxTemperature}°C`,
        windSpeed: statistics.avgWindSpeed,
        windDescription: getWindDescription(statistics.avgWindSpeed),
        humidity: statistics.avgHumidity,
        humidityDescription: getHumidityDescription(statistics.avgHumidity),
        cloudCover: statistics.avgCloudCover,
        cloudDescription: getCloudDescription(statistics.avgCloudCover),
        extremeEvents: statistics.extremeEventsProbability,
        extremeDescription: getExtremeDescription(statistics.extremeEventsProbability),
        alertMessage: trend.isSignificant ? trend.message : null
      },
      hourlyAnalysis: hourlyResult.analysis,
      recommendedTimeSlots: hourlyResult.recommended,
      holidays: {
        count: nearbyHolidays.length,
        nearby: nearbyHolidays,
        messages: holidayMessages
      },
      alternativeDates: alternativeDates,
      dataSource: {
        provider: 'NASA POWER',
        period: `${historicalData.startYear}-${historicalData.endYear}`,
        yearsAnalyzed: historicalData.yearsCount
      },
      _performance: performanceMetrics // Métricas de performance para debug
    };
  } catch (error) {
    console.error(`Error processing location ${location.name}:`, error);
    // Return error for this specific location instead of failing everything
    return {
      location: {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      requestedDate: null,
      alternativeDates: [],
      dataSource: null
    };
  }
}

// Geocoding using OpenStreetMap Nominatim (free, no API key needed)
// Also accepts direct coordinates in format "lat, lon"
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number }> {
  // Check if input is coordinates (format: "lat, lon" or "lat,lon")
  const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  const coordMatch = location.match(coordPattern);
  
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    
    // Validate coordinates
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      console.log('Using direct coordinates:', { lat, lon });
      return { lat, lon };
    }
  }
  
  // Otherwise, geocode the location name
  // Clean up location string for better matching
  const cleanLocation = location
    .replace(/\s*,\s*BRA$/i, ', Brazil')  // Replace BRA with Brazil
    .replace(/\s*,\s*BR$/i, ', Brazil')    // Replace BR with Brazil
    .trim();
  
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanLocation)}&format=json&limit=1&accept-language=pt-BR,pt,en`;
  
  console.log('Geocoding location:', cleanLocation);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WeatherWise-Planner/1.0'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to geocode location');
  }

  const data = await response.json();
  
  if (!data || data.length === 0) {
    throw new Error(`Localização não encontrada. Tente usar o formato: "Cidade, Estado" ou coordenadas diretas "lat, lon"`);
  }

  const result = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
  
  console.log('Geocoded to:', result);
  return result;
}

// Fetch historical data from NASA POWER API
async function fetchHistoricalData(
  lat: number,
  lon: number,
  targetDate: string,
  apiKey: string
): Promise<any> {
  const date = new Date(targetDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 20;
  const endYear = currentYear - 1;

  // NASA POWER API for historical data
  const parameters = [
    'T2M',          // Temperature at 2 Meters
    'PRECTOTCORR', // Precipitation Corrected
    'RH2M',        // Relative Humidity at 2 Meters
    'WS2M',        // Wind Speed at 2 Meters
    'CLOUD_AMT'    // Cloud Amount
  ].join(',');

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=RE&longitude=${lon}&latitude=${lat}&start=${startYear}0101&end=${endYear}1231&format=JSON`;

  console.log('Fetching from NASA POWER API:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('NASA POWER API error:', errorText);
    throw new Error(`Failed to fetch NASA data: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract data for the specific day across all years
  const dayData: ClimateData[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    const dateKey = `${year}${month}${day}`;
    
    if (data.properties.parameter.T2M[dateKey] !== undefined) {
      dayData.push({
        temperature: data.properties.parameter.T2M[dateKey],
        precipitation: data.properties.parameter.PRECTOTCORR[dateKey] || 0,
        humidity: data.properties.parameter.RH2M[dateKey] || 0,
        windSpeed: data.properties.parameter.WS2M[dateKey] || 0,
        cloudCover: data.properties.parameter.CLOUD_AMT[dateKey] || 0
      });
    }
  }

  return {
    dayData: dayData,
    startYear: startYear,
    endYear: endYear,
    yearsCount: dayData.length
  };
}

// Calculate statistics from historical data
function calculateStatistics(historicalData: any) {
  const { dayData } = historicalData;
  
  const temperatures = dayData.map((d: ClimateData) => d.temperature);
  const precipitations = dayData.map((d: ClimateData) => d.precipitation);
  const humidities = dayData.map((d: ClimateData) => d.humidity);
  const windSpeeds = dayData.map((d: ClimateData) => d.windSpeed);
  const cloudCovers = dayData.map((d: ClimateData) => d.cloudCover);

  const avgTemperature = Math.round(average(temperatures));
  const minTemperature = Math.round(Math.min(...temperatures));
  const maxTemperature = Math.round(Math.max(...temperatures));
  
  // Rain probability: percentage of days with precipitation > 1mm
  const rainyDays = precipitations.filter((p: number) => p > 1).length;
  const rainProbability = Math.round((rainyDays / dayData.length) * 100);
  
  const avgHumidity = Math.round(average(humidities));
  const avgWindSpeed = Math.round(average(windSpeeds));
  const avgCloudCover = Math.round(average(cloudCovers));
  
  // Extreme events: temperature extremes or heavy rain
  const extremeDays = dayData.filter((d: ClimateData) => 
    d.temperature < 10 || d.temperature > 35 || d.precipitation > 10
  ).length;
  const extremeEventsProbability = Math.round((extremeDays / dayData.length) * 100);

  return {
    avgTemperature,
    minTemperature,
    maxTemperature,
    rainProbability,
    avgHumidity,
    avgWindSpeed,
    avgCloudCover,
    extremeEventsProbability
  };
}

// Calculate Personal Comfort Index (ICP)
function calculateICP(
  statistics: any,
  preferredTemperature: number,
  eventType: string
): number {
  let score = 100;

  // Temperature penalty (25% weight)
  const tempDiff = Math.abs(statistics.avgTemperature - preferredTemperature);
  score -= tempDiff * 2.5;

  // Rain probability penalty (30% weight)
  score -= statistics.rainProbability * 0.3;

  // Wind penalty (15% weight) - varies by event type
  const windThreshold = getWindThresholdForEvent(eventType);
  if (statistics.avgWindSpeed > windThreshold) {
    score -= (statistics.avgWindSpeed - windThreshold) * 1.5;
  }

  // Humidity penalty (15% weight)
  const optimalHumidity = 60;
  const humidityDiff = Math.abs(statistics.avgHumidity - optimalHumidity);
  score -= humidityDiff * 0.15;

  // Extreme events penalty (15% weight)
  score -= statistics.extremeEventsProbability * 1.5;

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Detect climate trends using linear regression
function detectTrend(historicalData: any) {
  const { dayData } = historicalData;
  
  if (dayData.length < 10) {
    return { isSignificant: false, message: '' };
  }

  // Calculate trend in rain probability
  const recentYears = dayData.slice(-5);
  const olderYears = dayData.slice(0, 5);
  
  const recentRainDays = recentYears.filter((d: ClimateData) => d.precipitation > 1).length;
  const olderRainDays = olderYears.filter((d: ClimateData) => d.precipitation > 1).length;
  
  const recentRainProb = (recentRainDays / recentYears.length) * 100;
  const olderRainProb = (olderRainDays / olderYears.length) * 100;
  
  const change = recentRainProb - olderRainProb;
  
  if (Math.abs(change) > 10) {
    return {
      isSignificant: true,
      message: `A probabilidade de chuva ${change > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(Math.round(change))}% na última década nesta região durante este período. ${change > 0 ? 'Recomendamos fortemente considerar um plano B coberto ou datas alternativas.' : 'As condições climáticas têm melhorado para eventos ao ar livre.'}`
    };
  }
  
  return { isSignificant: false, message: '' };
}

// Suggest alternative dates
async function suggestAlternativeDates(
  lat: number,
  lon: number,
  targetDate: string,
  preferredTemperature: number,
  eventType: string,
  apiKey: string
) {
  const date = new Date(targetDate);
  const offsets = [-7, -14, 7, 14];
  
  // 🚀 OTIMIZAÇÃO: Buscar TODAS as datas alternativas em PARALELO
  console.log('⚡ Fetching alternative dates in parallel...');
  const startTime = performance.now();
  
  const promises = offsets.map(async (offset) => {
    const altDate = new Date(date);
    altDate.setDate(altDate.getDate() + offset);
    const altDateStr = altDate.toISOString().split('T')[0];
    
    try {
      const historicalData = await fetchHistoricalData(lat, lon, altDateStr, apiKey);
      const statistics = calculateStatistics(historicalData);
      const icp = calculateICP(statistics, preferredTemperature, eventType);
      
      return {
        date: altDateStr,
        displayDate: formatDate(altDateStr),
        icp: icp,
        rainProbability: statistics.rainProbability,
        temperature: statistics.avgTemperature,
        temperatureRange: `${statistics.minTemperature}°C - ${statistics.maxTemperature}°C`,
        windSpeed: statistics.avgWindSpeed,
        windDescription: getWindDescription(statistics.avgWindSpeed),
        humidity: statistics.avgHumidity,
        humidityDescription: getHumidityDescription(statistics.avgHumidity),
        cloudCover: statistics.avgCloudCover,
        cloudDescription: getCloudDescription(statistics.avgCloudCover),
        extremeEvents: statistics.extremeEventsProbability,
        extremeDescription: getExtremeDescription(statistics.extremeEventsProbability)
      };
    } catch (error) {
      console.error(`Failed to fetch data for alternative date ${altDateStr}:`, error);
      return null;
    }
  });
  
  // Aguardar todas as requisições em paralelo
  const results = await Promise.all(promises);
  const alternatives = results.filter(r => r !== null);
  
  const endTime = performance.now();
  console.log(`✅ Alternative dates fetched in ${(endTime - startTime).toFixed(0)}ms (parallel)`);
  
  // Sort by ICP score (highest first)
  return alternatives.sort((a, b) => b.icp - a.icp);
}

// Helper functions
function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function getWindThresholdForEvent(eventType: string): number {
  const thresholds: { [key: string]: number } = {
    wedding: 15,
    sports: 20,
    festival: 18,
    agriculture: 25,
    corporate: 15,
    outdoor: 20
  };
  return thresholds[eventType] || 20;
}

function getWindDescription(windSpeed: number): string {
  if (windSpeed < 10) return 'Vento fraco, condições excelentes';
  if (windSpeed < 20) return 'Vento moderado, condições normais';
  if (windSpeed < 30) return 'Vento forte, pode causar desconforto';
  return 'Vento muito forte, não recomendado para eventos ao ar livre';
}

function getHumidityDescription(humidity: number): string {
  if (humidity < 40) return 'Ar seco';
  if (humidity < 70) return 'Umidade confortável';
  return 'Umidade elevada, pode causar desconforto';
}

function getCloudDescription(cloudCover: number): string {
  if (cloudCover < 20) return 'Céu limpo';
  if (cloudCover < 50) return 'Poucas nuvens';
  if (cloudCover < 80) return 'Parcialmente nublado';
  return 'Muito nublado';
}

function getExtremeDescription(probability: number): string {
  if (probability < 5) return 'Probabilidade mínima de extremos';
  if (probability < 15) return 'Baixa probabilidade de extremos';
  if (probability < 30) return 'Probabilidade moderada de extremos';
  return 'Alta probabilidade de eventos extremos';
}

// ============= HOURLY ANALYSIS FUNCTIONS =============

/**
 * Gera dados de previsão horária simulados baseados em dados históricos
 * Nota: Em produção, deve-se usar uma API de previsão real como OpenWeatherMap ou WeatherAPI
 */
async function generateHourlyForecast(
  latitude: number,
  longitude: number,
  date: string,
  historicalStats: any
): Promise<any[]> {
  const hourlyData = [];
  const targetDate = new Date(date);
  
  // Gerar dados hora a hora (6h às 22h)
  for (let hour = 6; hour <= 22; hour++) {
    const hourDate = new Date(targetDate);
    hourDate.setHours(hour, 0, 0, 0);
    
    // Simular variação de temperatura ao longo do dia
    const tempVariation = Math.sin((hour - 6) * Math.PI / 16) * 5;
    const temp_c = historicalStats.avgTemperature + tempVariation + (Math.random() - 0.5) * 2;
    
    // Simular chance de chuva (maior à tarde)
    const rainBaseChance = historicalStats.rainProbability;
    const rainVariation = hour >= 14 && hour <= 18 ? 10 : 0;
    const chance_of_rain = Math.min(100, Math.max(0, rainBaseChance + rainVariation + (Math.random() - 0.5) * 15));
    
    // Simular outros parâmetros
    const humidity = historicalStats.avgHumidity + (Math.random() - 0.5) * 10;
    const wind_kph = historicalStats.avgWindSpeed + (Math.random() - 0.5) * 5;
    
    hourlyData.push({
      time: hourDate.toISOString(),
      temp_c: Math.round(temp_c * 10) / 10,
      condition: chance_of_rain > 60 ? 'Possibilidade de chuva' : chance_of_rain > 30 ? 'Parcialmente nublado' : 'Claro',
      precip_mm: chance_of_rain > 60 ? (Math.random() * 5) : 0,
      chance_of_rain: Math.round(chance_of_rain),
      humidity: Math.round(humidity),
      wind_kph: Math.round(wind_kph * 10) / 10,
      uv: hour >= 10 && hour <= 16 ? Math.min(11, 3 + (Math.random() * 5)) : 0,
      is_day: hour >= 6 && hour <= 18 ? 1 : 0
    });
  }
  
  return hourlyData;
}

/**
 * Analisa um intervalo de tempo específico
 */
function analyzeTimeSlot(hourlyForecast: any[], startHour: number, endHour: number) {
  const relevantHours = hourlyForecast.filter(hour => {
    const hourNum = new Date(hour.time).getHours();
    return hourNum >= startHour && hourNum <= endHour;
  });
  
  if (relevantHours.length === 0) {
    return null;
  }
  
  // Calcular médias e valores máximos
  const avgTemp = relevantHours.reduce((sum, hour) => sum + hour.temp_c, 0) / relevantHours.length;
  const maxPrecipChance = Math.max(...relevantHours.map(hour => hour.chance_of_rain));
  const avgHumidity = relevantHours.reduce((sum, hour) => sum + hour.humidity, 0) / relevantHours.length;
  const avgWindSpeed = relevantHours.reduce((sum, hour) => sum + hour.wind_kph, 0) / relevantHours.length;
  
  // Calcular índice de conforto
  const comfortIndex = calculateComfortIndex({
    temperature: avgTemp,
    precipitation: maxPrecipChance,
    humidity: avgHumidity,
    windSpeed: avgWindSpeed
  });
  
  // Gerar mensagem de alerta se necessário
  let alertMessage = null;
  if (maxPrecipChance > 50) {
    alertMessage = `Alta probabilidade de chuva (${Math.round(maxPrecipChance)}%) durante o horário selecionado.`;
  } else if (avgTemp > 30) {
    alertMessage = `Temperatura média elevada (${avgTemp.toFixed(1)}°C) durante o horário selecionado.`;
  } else if (avgTemp < 15) {
    alertMessage = `Temperatura média baixa (${avgTemp.toFixed(1)}°C) durante o horário selecionado.`;
  }
  
  return {
    timeSlot: `${startHour}:00 - ${endHour}:00`,
    averageTemperature: Math.round(avgTemp * 10) / 10,
    maxPrecipitationChance: Math.round(maxPrecipChance),
    averageHumidity: Math.round(avgHumidity),
    averageWindSpeed: Math.round(avgWindSpeed * 10) / 10,
    comfortIndex,
    alertMessage,
    hourlyData: relevantHours
  };
}

/**
 * Encontra os melhores horários alternativos
 */
function findOptimalTimeSlots(
  hourlyForecast: any[],
  originalStartHour: number,
  originalEndHour: number
): any[] {
  const duration = originalEndHour - originalStartHour;
  const slots = [];
  
  // Verificar todos os possíveis intervalos (6h às 20h)
  for (let startHour = 6; startHour <= 20 - duration; startHour++) {
    const endHour = startHour + duration;
    
    // Não incluir o horário original
    if (startHour === originalStartHour) continue;
    
    const analysis = analyzeTimeSlot(hourlyForecast, startHour, endHour);
    
    if (analysis) {
      slots.push({
        startHour,
        endHour,
        timeSlot: `${startHour}:00 - ${endHour}:00`,
        comfortIndex: analysis.comfortIndex
      });
    }
  }
  
  // Ordenar por índice de conforto (decrescente) e retornar os 3 melhores
  return slots
    .sort((a, b) => b.comfortIndex - a.comfortIndex)
    .slice(0, 3);
}

/**
 * Calcula o índice de conforto para um conjunto de condições
 */
function calculateComfortIndex(params: {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}): number {
  const { temperature, precipitation, humidity, windSpeed } = params;
  
  // Pesos para cada fator
  const weights = {
    temperature: 0.4,
    precipitation: 0.3,
    humidity: 0.2,
    windSpeed: 0.1
  };
  
  // Normalizar cada fator para uma escala de 0-100
  const normalizedTemp = normalizeTemperature(temperature);
  const normalizedPrecip = normalizePrecipitation(precipitation);
  const normalizedHumidity = normalizeHumidity(humidity);
  const normalizedWind = normalizeWindSpeed(windSpeed);
  
  // Calcular o índice ponderado
  const index = 
    weights.temperature * normalizedTemp +
    weights.precipitation * normalizedPrecip +
    weights.humidity * normalizedHumidity +
    weights.windSpeed * normalizedWind;
  
  return Math.round(index);
}

/**
 * Funções de normalização para o índice de conforto
 */
function normalizeTemperature(temp: number): number {
  // Temperatura ideal: 22-25°C
  if (temp >= 22 && temp <= 25) return 100;
  if (temp < 22) return Math.max(0, 100 - (22 - temp) * 5);
  return Math.max(0, 100 - (temp - 25) * 5);
}

function normalizePrecipitation(chance: number): number {
  // Quanto menor a chance de chuva, melhor
  return Math.max(0, 100 - chance);
}

function normalizeHumidity(humidity: number): number {
  // Umidade ideal: 40-60%
  if (humidity >= 40 && humidity <= 60) return 100;
  if (humidity < 40) return Math.max(0, 100 - (40 - humidity) * 2);
  return Math.max(0, 100 - (humidity - 60) * 2);
}

function normalizeWindSpeed(speed: number): number {
  // Velocidade do vento ideal: 0-15 km/h
  if (speed <= 15) return 100;
  if (speed <= 30) return Math.max(0, 100 - (speed - 15) * 3);
  return 10; // Vento muito forte
}

// ============= END HOURLY ANALYSIS FUNCTIONS =============
