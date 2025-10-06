import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudRain, Wind, Droplets, Thermometer, Clock } from 'lucide-react';

interface HourlyData {
  time: string;
  temp_c: number;
  condition: string;
  precip_mm: number;
  chance_of_rain: number;
  humidity: number;
  wind_kph: number;
  is_day: number;
}

interface HourlyAnalysis {
  timeSlot: string;
  averageTemperature: number;
  maxPrecipitationChance: number;
  averageHumidity: number;
  averageWindSpeed: number;
  comfortIndex: number;
  alertMessage: string | null;
  hourlyData: HourlyData[];
}

interface RecommendedTimeSlot {
  startHour: number;
  endHour: number;
  timeSlot: string;
  comfortIndex: number;
}

interface HourlyForecastChartProps {
  hourlyAnalysis: HourlyAnalysis | null;
  recommendedTimeSlots: RecommendedTimeSlot[];
  selectedDate: string;
  onTimeSlotSelect?: (startHour: number, endHour: number) => void;
}

const HourlyForecastChart: React.FC<HourlyForecastChartProps> = ({
  hourlyAnalysis,
  recommendedTimeSlots,
  selectedDate,
  onTimeSlotSelect
}) => {
  if (!hourlyAnalysis) {
    return null;
  }
  
  const { hourlyData, timeSlot, comfortIndex, alertMessage } = hourlyAnalysis;
  
  // Extrair horas de início e fim do timeSlot
  const [startHour, endHour] = timeSlot.split(' - ').map(time => parseInt(time.split(':')[0]));
  
  // Determinar cor do índice de conforto
  const getComfortColor = (index: number) => {
    if (index >= 80) return 'text-green-600';
    if (index >= 60) return 'text-lime-600';
    if (index >= 40) return 'text-yellow-600';
    if (index >= 20) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getComfortBgColor = (index: number) => {
    if (index >= 80) return 'bg-green-600';
    if (index >= 60) return 'bg-lime-500';
    if (index >= 40) return 'bg-yellow-500';
    if (index >= 20) return 'bg-orange-500';
    return 'bg-red-600';
  };
  
  // Determinar texto do índice de conforto
  const getComfortText = (index: number) => {
    if (index >= 80) return 'Excelente';
    if (index >= 60) return 'Bom';
    if (index >= 40) return 'Moderado';
    if (index >= 20) return 'Desfavorável';
    return 'Ruim';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Previsão Horária
              </CardTitle>
              <CardDescription>
                Análise detalhada do período selecionado
              </CardDescription>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm text-muted-foreground">Horário selecionado</div>
              <div className="font-medium text-lg">{timeSlot}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">Índice de Conforto para o Horário</div>
              <div className={`font-bold text-lg ${getComfortColor(comfortIndex)}`}>
                {comfortIndex}/100 - {getComfortText(comfortIndex)}
              </div>
            </div>
            
            <div className="w-full bg-secondary rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getComfortBgColor(comfortIndex)}`}
                style={{ width: `${comfortIndex}%` }}
              ></div>
            </div>
            
            {alertMessage && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-md flex items-start">
                <CloudRain className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{alertMessage}</p>
              </div>
            )}
          </div>
          
          {/* Métricas do período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900">
              <Thermometer className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="text-xs text-muted-foreground text-center">Temperatura Média</span>
              <span className="font-bold text-lg">{hourlyAnalysis.averageTemperature.toFixed(1)}°C</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg border border-cyan-100 dark:border-cyan-900">
              <CloudRain className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mb-2" />
              <span className="text-xs text-muted-foreground text-center">Chance de Chuva</span>
              <span className="font-bold text-lg">{hourlyAnalysis.maxPrecipitationChance}%</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-100 dark:border-indigo-900">
              <Droplets className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mb-2" />
              <span className="text-xs text-muted-foreground text-center">Umidade Média</span>
              <span className="font-bold text-lg">{Math.round(hourlyAnalysis.averageHumidity)}%</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-100 dark:border-emerald-900">
              <Wind className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
              <span className="text-xs text-muted-foreground text-center">Vento Médio</span>
              <span className="font-bold text-lg">{hourlyAnalysis.averageWindSpeed.toFixed(1)} km/h</span>
            </div>
          </div>

          {/* Timeline de horas */}
          {hourlyData && hourlyData.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3 text-sm">Detalhamento por Hora</h4>
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-max">
                  {hourlyData.map((hour, idx) => {
                    const hourTime = new Date(hour.time).getHours();
                    const isInRange = hourTime >= startHour && hourTime <= endHour;
                    return (
                      <div 
                        key={idx}
                        className={`flex flex-col items-center p-3 rounded-lg border min-w-[100px] ${
                          isInRange 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-secondary border-border'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1">
                          {hourTime.toString().padStart(2, '0')}:00
                        </div>
                        <div className="text-lg font-bold mb-1">
                          {Math.round(hour.temp_c)}°C
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {hour.chance_of_rain}% chuva
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(hour.wind_kph)} km/h
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {recommendedTimeSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Horários Recomendados</CardTitle>
            <CardDescription>
              Sugestões de horários alternativos com melhores condições climáticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendedTimeSlots.map((slot, index) => {
                const diff = slot.comfortIndex - comfortIndex;
                return (
                  <div 
                    key={index}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onTimeSlotSelect?.(slot.startHour, slot.endHour)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        slot.comfortIndex >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' :
                        slot.comfortIndex >= 60 ? 'bg-lime-100 text-lime-600 dark:bg-lime-950 dark:text-lime-400' :
                        'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
                      }`}>
                        {index + 1}º
                      </div>
                      <div>
                        <div className="font-medium">{slot.timeSlot}</div>
                        <div className="text-sm text-muted-foreground">
                          Índice de Conforto: {slot.comfortIndex}/100
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={diff > 0 ? "default" : "secondary"}
                      className={
                        slot.comfortIndex >= 80 ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-400' :
                        slot.comfortIndex >= 60 ? 'bg-lime-100 text-lime-800 hover:bg-lime-200 dark:bg-lime-950 dark:text-lime-400' :
                        'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400'
                      }
                    >
                      {diff > 0 ? `+${diff}` : diff} pts
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              💡 Clique em um horário para visualizar seus detalhes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HourlyForecastChart;
