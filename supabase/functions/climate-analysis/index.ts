import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClimateRequest {
  location: string;
  date: string;
  eventType: string;
  preferredTemperature: number;
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
    const { location, date, eventType, preferredTemperature }: ClimateRequest = await req.json();
    console.log('Processing climate analysis for:', { location, date, eventType });

    const NASA_API_KEY = Deno.env.get('NASA_API_KEY_NEW');
    if (!NASA_API_KEY) {
      throw new Error('NASA_API_KEY not configured');
    }

    // 1. Geocode the location
    const coordinates = await geocodeLocation(location);
    console.log('Coordinates:', coordinates);

    // 2. Fetch historical climate data from NASA POWER API
    const historicalData = await fetchHistoricalData(
      coordinates.lat,
      coordinates.lon,
      date,
      NASA_API_KEY
    );
    console.log('Fetched historical data for 20+ years');

    // 3. Calculate statistics and probabilities
    const statistics = calculateStatistics(historicalData);
    
    // 4. Calculate Personal Comfort Index (ICP)
    const icp = calculateICP(statistics, preferredTemperature, eventType);
    
    // 5. Detect climate trends
    const trend = detectTrend(historicalData);
    
    // 6. Suggest alternative dates
    const alternativeDates = await suggestAlternativeDates(
      coordinates.lat,
      coordinates.lon,
      date,
      preferredTemperature,
      eventType,
      NASA_API_KEY
    );

    // 7. Format response
    const response = {
      location: {
        name: location,
        coordinates: coordinates
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
      alternativeDates: alternativeDates,
      dataSource: {
        provider: 'NASA POWER',
        period: `${historicalData.startYear}-${historicalData.endYear}`,
        yearsAnalyzed: historicalData.yearsCount
      }
    };

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
  const alternatives = [];
  
  // Check 7 days before and after
  for (let offset of [-7, -14, 7, 14]) {
    const altDate = new Date(date);
    altDate.setDate(altDate.getDate() + offset);
    
    const altDateStr = altDate.toISOString().split('T')[0];
    
    try {
      const historicalData = await fetchHistoricalData(lat, lon, altDateStr, apiKey);
      const statistics = calculateStatistics(historicalData);
      const icp = calculateICP(statistics, preferredTemperature, eventType);
      
      alternatives.push({
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
      });
    } catch (error) {
      console.error(`Failed to fetch data for alternative date ${altDateStr}:`, error);
    }
  }
  
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
